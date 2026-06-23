# Build
FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

# Runtime (glibc slim — tiny idle RAM; certs needed for Turso TLS)
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/finances-api /usr/local/bin/finances-api
ENV PORT=8080
EXPOSE 8080
CMD ["finances-api"]
