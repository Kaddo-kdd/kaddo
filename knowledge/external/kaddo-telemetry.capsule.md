---
type: knowledge-capsule
system: kaddo-telemetry
version: 1
updated_at: 2026-09-29
owner: Kaddo Core Team
source_project: kaddo-telemetry
---

# kaddo-telemetry — Knowledge Capsule

## Purpose

Backend serverless de Kaddo para registrar instalaciones anónimas, verificar la autenticidad e integridad de la telemetría emitida por el ecosistema (CLI, MCP server y herramientas oficiales) mediante firmas digitales Ed25519, y persistir metadata cuantitativa de uso en DynamoDB sin recolectar información de identificación personal (PII).

## Responsibilities

- **Registro Anónimo de Identidades:** Registrar claves públicas Ed25519 vinculadas a identificadores aleatorios únicos (`installationId`) con garantía de idempotencia.
- **Verificación Criptográfica Obligatoria:** Validar la firma digital Ed25519 calculada sobre el payload canónico de 6 líneas en cada petición de ingesta.
- **Protección Anti-Replay:** Verificar la frescura temporal de la petición (ventana de ±300s) y registrar nonces de un solo uso de forma atómica en DynamoDB.
- **Validación e Ingesta de Lotes:** Validar esquemas de eventos estructurados (lotes de 1 a 25 eventos), normalizar metadata de recepción y almacenar condicionalmente en DynamoDB.
- **Depuración Automática (TTL):** Expirar y depurar automáticamente registros de eventos y nonces tras su período de retención (180 días por defecto para eventos).
- **Agregación Analítica Interna (VS-108):** Calcular agregaciones periódicas diarias de métricas del ecosistema y disponibilizarlas internamente protegidas por IAM.
- **Exposición Canónica Segura:** Exponer los endpoints públicos mediante HTTPS bajo el dominio canónico `https://telemetry.kaddo.org`.

## Exposed Capabilities

- **Anonymous Identity & Registration:** Gestión de identidades anónimas de clientes y registro de claves públicas (`POST /v1/installations`).
- **Security & Signature Verification:** Autenticación criptográfica con firmas Ed25519 y control de replay mediante nonces (`POST /v1/events`).
- **Telemetry Ingestion & Storage:** Validación de esquemas, normalización de lotes y persistencia idempotente con retención configurable.
- **Operational Monitoring & Health Check:** Endpoint de salud de alta disponibilidad (`GET /health`) y monitoreo de throttling.
- **Custom Domain & TLS Termination:** Dominio canónico regional `telemetry.kaddo.org` gestionado con AWS Certificate Manager y Route 53.
- **Ecosystem Usage Insights:** Agregador de métricas diarias del ecosistema para análisis interno (sin exposición pública).

## Public Contracts

### 1. `GET https://telemetry.kaddo.org/health`
- **Propósito:** Comprobar la disponibilidad operativa del servicio.
- **Headers requeridos:** Ninguno.
- **Body:** Vacío.
- **Respuestas:**
  - `200 OK`: `{"status":"ok"}`

### 2. `POST https://telemetry.kaddo.org/v1/installations`
- **Propósito:** Registrar una instalación anónima antes de emitir telemetría.
- **Headers requeridos:** `Content-Type: application/json`
- **Body (JSON máx 2048 bytes):**
  ```json
  {
    "installationId": "550e8400-e29b-41d4-a716-446655440000",
    "publicKey": "<base64url de clave pública SPKI Ed25519 (44 bytes)>",
    "keyAlgorithm": "Ed25519",
    "registrationVersion": "1.0"
  }
  ```
- **Respuestas:**
  - `201 Created`: `{"installationId":"...","status":"registered"}` (idempotente para misma clave).
  - `400 Bad Request`: Payload o formato de clave inválido.
  - `409 Conflict`: `{"error":"INSTALLATION_ALREADY_REGISTERED"}` (intento de cambiar clave existente).

### 3. `POST https://telemetry.kaddo.org/v1/events`
- **Propósito:** Ingerir un lote de eventos firmado digitalmente.
- **Headers requeridos:**
  - `X-Kaddo-Installation-Id`: UUID v4 o ULID registrado.
  - `X-Kaddo-Timestamp`: Segundos Unix decimales del momento de firma.
  - `X-Kaddo-Nonce`: Cadena aleatoria de 22–128 caracteres.
  - `X-Kaddo-Signature-Version`: `"1"`
  - `X-Kaddo-Signature`: Firma Ed25519 (64 bytes en base64url).
  - `Content-Type`: `application/json`
- **Body (JSON máx 256 KB, 1 a 25 eventos):**
  ```json
  {
    "events": [
      {
        "schemaVersion": "1.0",
        "id": "uuid-v4-del-evento",
        "timestamp": "2026-09-29T12:00:00.000Z",
        "event": "command_executed",
        "installationId": "550e8400-e29b-41d4-a716-446655440000",
        "source": "cli",
        "properties": {
          "command": "guard",
          "durationMs": 420
        }
      }
    ]
  }
  ```
- **Respuestas:**
  - `202 Accepted`: `{"accepted": 25}`
  - `400 Bad Request`: Payload malformado o esquema no soportado.
  - `401 Unauthorized`: Firma inválida, alteración de cuerpo o instalación no registrada.
  - `409 Conflict`: Nonce reutilizado o timestamp fuera de ventana (`REPLAY_DETECTED`).

## Dependencies

- **AWS API Gateway HTTP API (v2):** Enrutamiento y control de tasa (rate limiting y burst) en región `us-west-2`.
- **AWS Lambda (Node.js 24):** Funciones `collector`, `registration`, `aggregator` e `insights`.
- **Amazon DynamoDB (On-Demand):**
  - `kaddo-telemetry-installations-prod`: Claves públicas e identidades.
  - `kaddo-telemetry-events-prod`: Eventos persistidos con TTL.
  - `kaddo-telemetry-nonces-prod`: Nonces con TTL corto para anti-replay.
  - `kaddo-telemetry-metrics-prod`: Snapshots agregados diarios.
- **Amazon Route 53:** Zona alojada `Z04734922BHDHSY5VN1IG` (`kaddo.org.`) con registro Alias hacia API Gateway.
- **AWS Certificate Manager (ACM):** Certificado SSL `us-west-2` para `*.kaddo.org` y `telemetry.kaddo.org`.

## Known Risks

- **Registro Público y Anónimo:** No se exige autenticación de cuenta de usuario para registrarse; la firma garantiza autenticidad del emisor registrado e integridad de los datos, pero no certifica la veracidad interna de los datos enviados.
- **Responsabilidad de Privacidad en el Productor:** El collector valida límites y tipados, pero no ejecuta análisis semántico de los campos de `properties`; los productores (CLI y MCP) son estrictamente responsables de no emitir PII, secretos ni rutas sensibles.
- **Límites de Concurrencia:** Existen límites de tasa en API Gateway y concurrencia reservada en Lambdas; peticiones en ráfagas extremas recibirán `429 Too Many Requests`.

## Relevant ADRs

- **ADR-001 / WI-107 — Idempotencia de Eventos con Escritura Condicional:** La primera escritura aceptada conserva el registro original (contenido, timestamp y TTL); los reintentos idénticos se aceptan como 202 sin sobreescribir ni resetear la retención.
- **WI-110 — Dominio Canónico y DNS con Route 53 y ACM:** API pública desacoplada bajo `https://telemetry.kaddo.org`.
- **VS-108 — Agregación Analítica Protegida por IAM:** Agregación diaria programada sin endpoints públicos de consulta; acceso restringido mediante IAM.

## Owners

- **Core Team:** Kaddo Core Maintainers (`team@kaddo.org`)
- **Repositorio:** `https://github.com/Kaddo-kdd/telemetry`

## Out of Scope

- Paneles de visualización o dashboards de analítica de acceso público.
- Gestión de usuarios, cuentas, suscripciones o facturación.
- Custodia o recepción de claves privadas (la clave privada Ed25519 reside única y exclusivamente en el cliente).
- Ingesta de código fuente, logs arbitrarios o prompts de usuario.

## Usage Notes

### Guía de Integración para Productores (Kaddo CLI / MCP):
1. **Generación de Identidad:**
   - Generar un UUID v4 / ULID para `installationId`.
   - Generar un par de claves Ed25519 en el cliente.
2. **Registro Inicial:**
   - Exportar la clave pública en formato DER SPKI (base64url sin padding).
   - Enviar a `POST https://telemetry.kaddo.org/v1/installations`.
3. **Firma y Emisión:**
   - Generar `nonce` aleatorio y `timestamp` Unix actual en segundos.
   - Calcular `SHA256` en minúsculas hexadecimal del body exacto.
   - Formar el string canónico:
     ```text
     POST\n/v1/events\n<installationId>\n<timestamp>\n<nonce>\n<sha256Hex>
     ```
   - Firmar con la clave privada Ed25519 y codificar la firma en base64url.
   - Enviar la petición con los headers `X-Kaddo-*`.
4. **Resiliencia:**
   - La emisión debe realizarse en segundo plano y de manera asíncrona; cualquier falla del servicio de telemetría debe fallar de forma silenciosa sin interrumpir los flujos del desarrollador.

> Security: this capsule must never contain secrets, tokens, credentials, PII or source code.
