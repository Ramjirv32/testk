# ---------- Build Stage ----------
FROM golang:1.24-alpine AS builder

RUN apk add --no-cache git
WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build static binary (smaller, reproducible)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o main .

# ---------- Runtime Stage ----------
FROM alpine:3.20

RUN apk --no-cache add ca-certificates

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV AI_SERVER_URL=http://localhost:5000
ENV SCRAPER_URL=http://localhost:5000

# Copy binary only
COPY --from=builder /app/main .

USER app

EXPOSE 7000

CMD ["./main"]
