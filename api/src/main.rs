use std::sync::Arc;

use axum::{
    extract::{Path, Query, Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, patch},
    Json, Router,
};
use libsql::{params, Builder, Connection, Database};
use serde::Deserialize;
use serde_json::{json, Value};
use tower_http::cors::CorsLayer;

const MIGRATIONS: &[(&str, &str)] = &[
    ("001_init", include_str!("../migrations/001_init.sql")),
    ("002_budgets", include_str!("../migrations/002_budgets.sql")),
];

#[derive(Clone)]
struct AppState {
    db: Arc<Database>,
    api_token: String,
}

impl AppState {
    fn conn(&self) -> Result<Connection, AppError> {
        Ok(self.db.connect()?)
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let url = std::env::var("TURSO_DATABASE_URL").expect("TURSO_DATABASE_URL");
    let token = std::env::var("TURSO_AUTH_TOKEN").expect("TURSO_AUTH_TOKEN");
    let api_token = std::env::var("API_TOKEN").expect("API_TOKEN");
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let db = Builder::new_remote(url, token).build().await?;
    migrate(&db.connect()?).await?;

    let state = AppState { db: Arc::new(db), api_token };

    let api = Router::new()
        .route("/transactions", get(list_transactions))
        .route("/transactions/:id", patch(patch_transaction))
        .route("/categories", get(list_categories))
        .route("/stats", get(stats))
        .route("/budgets", get(list_budgets).put(put_budget))
        .route("/budget-status", get(budget_status))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth));

    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        .nest("/api", api)
        .with_state(state)
        .layer(CorsLayer::permissive());

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

// ---------- migrations ----------
async fn migrate(conn: &Connection) -> anyhow::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT DEFAULT (datetime('now')));",
    )
    .await?;
    for (name, sql) in MIGRATIONS {
        let mut rows = conn
            .query("SELECT 1 FROM _migrations WHERE name = ?1", params![*name])
            .await?;
        if rows.next().await?.is_some() {
            continue;
        }
        conn.execute_batch(sql).await?;
        conn.execute("INSERT INTO _migrations (name) VALUES (?1)", params![*name])
            .await?;
        tracing::info!("applied migration {name}");
    }
    Ok(())
}

// ---------- auth ----------
async fn auth(State(st): State<AppState>, req: Request, next: Next) -> Result<Response, StatusCode> {
    let ok = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .map(|v| v == format!("Bearer {}", st.api_token))
        .unwrap_or(false);
    if ok {
        Ok(next.run(req).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}

// ---------- handlers ----------
#[derive(Deserialize)]
struct TxQuery {
    month: Option<String>,
    category: Option<String>,
    bank: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
}

async fn list_transactions(
    State(st): State<AppState>,
    Query(q): Query<TxQuery>,
) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    let month = q.month.unwrap_or_default();
    let category = q.category.unwrap_or_default();
    let bank = q.bank.unwrap_or_default();
    let limit = q.limit.unwrap_or(100).clamp(1, 1000);
    let offset = q.offset.unwrap_or(0).max(0);

    let sql = "SELECT dedupe_id,date,time,bank,card_last4,amount,currency,merchant,merchant_clean,\
               transaction_type,channel,confidence,category,source,created_at \
               FROM transactions \
               WHERE (?1 = '' OR strftime('%Y-%m', date) = ?1) \
                 AND (?2 = '' OR category = ?2) \
                 AND (?3 = '' OR bank = ?3) \
               ORDER BY date DESC, time DESC LIMIT ?4 OFFSET ?5";

    let mut rows = conn
        .query(sql, params![month, category, bank, limit, offset])
        .await?;
    let mut out = Vec::new();
    while let Some(r) = rows.next().await? {
        out.push(json!({
            "dedupe_id":        r.get::<Option<String>>(0)?,
            "date":             r.get::<Option<String>>(1)?,
            "time":             r.get::<Option<String>>(2)?,
            "bank":             r.get::<Option<String>>(3)?,
            "card_last4":       r.get::<Option<String>>(4)?,
            "amount":           r.get::<Option<f64>>(5)?,
            "currency":         r.get::<Option<String>>(6)?,
            "merchant":         r.get::<Option<String>>(7)?,
            "merchant_clean":   r.get::<Option<String>>(8)?,
            "transaction_type": r.get::<Option<String>>(9)?,
            "channel":          r.get::<Option<String>>(10)?,
            "confidence":       r.get::<Option<String>>(11)?,
            "category":         r.get::<Option<String>>(12)?,
            "source":           r.get::<Option<String>>(13)?,
            "created_at":       r.get::<Option<String>>(14)?,
        }));
    }
    Ok(Json(json!(out)))
}

async fn list_categories(State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    let mut rows = conn.query("SELECT name FROM categories ORDER BY name", ()).await?;
    let mut out = Vec::new();
    while let Some(r) = rows.next().await? {
        out.push(r.get::<String>(0)?);
    }
    Ok(Json(json!(out)))
}

#[derive(Deserialize)]
struct PatchTx {
    category: String,
}

async fn patch_transaction(
    State(st): State<AppState>,
    Path(id): Path<String>,
    Json(b): Json<PatchTx>,
) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    conn.execute(
        "INSERT OR IGNORE INTO categories (name) VALUES (?1)",
        params![b.category.clone()],
    )
    .await?;
    let n = conn
        .execute(
            "UPDATE transactions SET category = ?1 WHERE dedupe_id = ?2",
            params![b.category, id],
        )
        .await?;
    Ok(Json(json!({ "updated": n })))
}

#[derive(Deserialize)]
struct MonthQuery {
    month: Option<String>,
}

async fn stats(
    State(st): State<AppState>,
    Query(q): Query<MonthQuery>,
) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    let month = q.month.unwrap_or_default(); // '' = all time

    let mut by_currency = Vec::new();
    {
        let mut rows = conn
            .query(
                "SELECT currency, COALESCE(SUM(amount),0.0), COUNT(*) FROM transactions \
                 WHERE (?1 = '' OR strftime('%Y-%m', date) = ?1) GROUP BY currency",
                params![month.clone()],
            )
            .await?;
        while let Some(r) = rows.next().await? {
            by_currency.push(json!({
                "currency": r.get::<Option<String>>(0)?,
                "total":    r.get::<f64>(1)?,
                "count":    r.get::<i64>(2)?,
            }));
        }
    }

    let mut by_category = Vec::new();
    {
        let mut rows = conn
            .query(
                "SELECT category, currency, COALESCE(SUM(amount),0.0), COUNT(*) FROM transactions \
                 WHERE (?1 = '' OR strftime('%Y-%m', date) = ?1) \
                 GROUP BY category, currency ORDER BY 3 DESC",
                params![month.clone()],
            )
            .await?;
        while let Some(r) = rows.next().await? {
            by_category.push(json!({
                "category": r.get::<Option<String>>(0)?,
                "currency": r.get::<Option<String>>(1)?,
                "total":    r.get::<f64>(2)?,
                "count":    r.get::<i64>(3)?,
            }));
        }
    }

    let mut by_bank = Vec::new();
    {
        let mut rows = conn
            .query(
                "SELECT bank, currency, COALESCE(SUM(amount),0.0) FROM transactions \
                 WHERE (?1 = '' OR strftime('%Y-%m', date) = ?1) GROUP BY bank, currency",
                params![month.clone()],
            )
            .await?;
        while let Some(r) = rows.next().await? {
            by_bank.push(json!({
                "bank":     r.get::<Option<String>>(0)?,
                "currency": r.get::<Option<String>>(1)?,
                "total":    r.get::<f64>(2)?,
            }));
        }
    }

    let mut by_day = Vec::new();
    {
        let mut rows = conn
            .query(
                "SELECT date, currency, COALESCE(SUM(amount),0.0) FROM transactions \
                 WHERE (?1 = '' OR strftime('%Y-%m', date) = ?1) GROUP BY date, currency ORDER BY date",
                params![month.clone()],
            )
            .await?;
        while let Some(r) = rows.next().await? {
            by_day.push(json!({
                "date":     r.get::<Option<String>>(0)?,
                "currency": r.get::<Option<String>>(1)?,
                "total":    r.get::<f64>(2)?,
            }));
        }
    }

    Ok(Json(json!({
        "month": if month.is_empty() { Value::Null } else { json!(month) },
        "by_currency": by_currency,
        "by_category": by_category,
        "by_bank": by_bank,
        "by_day": by_day,
    })))
}

async fn list_budgets(State(st): State<AppState>) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    let mut rows = conn
        .query(
            "SELECT category, currency, monthly_limit FROM budgets ORDER BY category, currency",
            (),
        )
        .await?;
    let mut out = Vec::new();
    while let Some(r) = rows.next().await? {
        out.push(json!({
            "category": r.get::<String>(0)?,
            "currency": r.get::<String>(1)?,
            "monthly_limit": r.get::<f64>(2)?,
        }));
    }
    Ok(Json(json!(out)))
}

#[derive(Deserialize)]
struct BudgetBody {
    category: String,
    currency: Option<String>,
    monthly_limit: f64,
}

async fn put_budget(
    State(st): State<AppState>,
    Json(b): Json<BudgetBody>,
) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    let currency = b.currency.unwrap_or_else(|| "PEN".to_string());
    conn.execute(
        "INSERT INTO budgets (category, currency, monthly_limit) VALUES (?1, ?2, ?3) \
         ON CONFLICT(category, currency) DO UPDATE SET monthly_limit = excluded.monthly_limit",
        params![b.category, currency, b.monthly_limit],
    )
    .await?;
    Ok(Json(json!({ "ok": true })))
}

/// The LLM advisor's tool: per-category spend vs budget for a month (defaults to current).
async fn budget_status(
    State(st): State<AppState>,
    Query(q): Query<MonthQuery>,
) -> Result<Json<Value>, AppError> {
    let conn = st.conn()?;
    let month = match q.month {
        Some(m) if !m.is_empty() => m,
        _ => {
            let mut r = conn.query("SELECT strftime('%Y-%m','now')", ()).await?;
            r.next()
                .await?
                .ok_or_else(|| anyhow::anyhow!("no row"))?
                .get::<String>(0)?
        }
    };

    let mut rows = conn
        .query(
            "SELECT b.category, b.currency, b.monthly_limit, \
               COALESCE((SELECT SUM(t.amount) FROM transactions t \
                         WHERE t.category = b.category AND t.currency = b.currency \
                           AND strftime('%Y-%m', t.date) = ?1), 0.0) AS spent \
             FROM budgets b ORDER BY b.category, b.currency",
            params![month.clone()],
        )
        .await?;

    let mut budgets = Vec::new();
    while let Some(r) = rows.next().await? {
        let limit = r.get::<f64>(2)?;
        let spent = r.get::<f64>(3)?;
        budgets.push(json!({
            "category":  r.get::<String>(0)?,
            "currency":  r.get::<String>(1)?,
            "limit":     limit,
            "spent":     spent,
            "remaining": limit - spent,
            "over":      spent > limit,
            "pct":       if limit > 0.0 { (spent / limit * 100.0).round() } else { 0.0 },
        }));
    }

    Ok(Json(json!({ "month": month, "budgets": budgets })))
}

// ---------- error ----------
struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("{:#}", self.0);
        (StatusCode::INTERNAL_SERVER_ERROR, format!("error: {}", self.0)).into_response()
    }
}

impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(e: E) -> Self {
        Self(e.into())
    }
}
