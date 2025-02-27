# build rust/wasm
FROM rust:latest AS rust-builder

RUN cargo install wasm-pack

WORKDIR /app

COPY wasm ./wasm

WORKDIR /app/wasm
RUN wasm-pack build --target web

# build react
FROM node:18 AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Copy built WASM files inside src/wasm
RUN mkdir -p src/wasm
COPY --from=rust-builder /app/wasm/pkg ./src/wasm/pkg

# build the react app
RUN npm run build

# serve
FROM nginx:alpine

# copy built frontend
COPY --from=frontend-builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
