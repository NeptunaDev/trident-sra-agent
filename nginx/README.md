# Nginx Reverse Proxy

Configuración de nginx como reverse proxy para la API REST (3417) y WebSocket (8080) del Trident Agent.

## Estructura

```
nginx/
├── conf.d/
│   ├── mi-servicio.conf          # Activo: HTTP sin SSL (desarrollo)
│   └── mi-servicio-ssl.conf.example  # Plantilla: HTTPS con TLS (producción)
└── README.md
```

## Uso

### Desarrollo (por defecto)

- **mi-servicio.conf** escucha en el puerto **4040** (HTTP)
- Enruta `/api/` → host:3417 y `/ws/` → host:8080
- El Trident Agent debe estar corriendo en el host

```bash
docker compose up -d nginx
```

### Producción (SSL/TLS)

1. Obtén certificados Let's Encrypt en el host (`/etc/letsencrypt/live/tudominio.com/`)
2. Copia la plantilla SSL:
   ```bash
   cp nginx/conf.d/mi-servicio-ssl.conf.example nginx/conf.d/mi-servicio.conf
   ```
3. Edita `mi-servicio.conf` y reemplaza `tudominio.com` por tu dominio
4. En `docker-compose.yml`, descomenta el volumen de certificados:
   ```yaml
   - /etc/letsencrypt:/etc/letsencrypt:ro
   ```
5. Reinicia: `docker compose up -d nginx`

## Notas

- **host.docker.internal**: Permite al contenedor nginx alcanzar la API y WebSocket en el host. En Linux requiere `extra_hosts` (ya configurado).
- **Rate limiting**: 30 req/s por IP, burst 50 en `/api/`; máx. 20 conexiones simultáneas API, 50 en WebSocket.
