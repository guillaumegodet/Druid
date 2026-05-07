# Build stage — Vite bakes VITE_* vars into the bundle at build time
FROM node:20-slim AS build

ARG VITE_GRIST_DOC_ID
ARG VITE_GRIST_RESEARCHERS_TABLE=Annuaire
ARG VITE_GRIST_STRUCTURES_TABLE=Structures

ENV VITE_GRIST_DOC_ID=$VITE_GRIST_DOC_ID
ENV VITE_GRIST_RESEARCHERS_TABLE=$VITE_GRIST_RESEARCHERS_TABLE
ENV VITE_GRIST_STRUCTURES_TABLE=$VITE_GRIST_STRUCTURES_TABLE

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/server.cjs ./server.cjs

EXPOSE 3000
CMD ["node", "server.cjs"]
