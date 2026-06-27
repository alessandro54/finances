# Build — pure-Go, CGO disabled (libsql driver is pure Go) → static binary.
FROM golang:1.25-bookworm AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /finances-api ./cmd/server

# Runtime — distroless static nonroot (ships CA certs for Turso TLS); tiny, no shell.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /finances-api /finances-api
ENV PORT=8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/finances-api"]
