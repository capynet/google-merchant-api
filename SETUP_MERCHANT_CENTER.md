# Configuración de Google Merchant Center con tu Proyecto GCP

## Problema Actual
El error que estás recibiendo indica que tu proyecto GCP no está vinculado con Merchant Center:
```
GCP project with id products-management-473007 and number 478678060652 is not registered with the merchant account.
```

## Solución: Vincular tu Proyecto GCP con Merchant Center

### Pasos a seguir:

1. **Accede a Google Merchant Center**
   - Ve a https://merchants.google.com
   - Inicia sesión con la cuenta que tiene acceso al Merchant Center

2. **Navega a la configuración de API**
   - En el menú lateral, ve a **Configuración** (Settings)
   - Busca la sección **API** o **Content API**

3. **Vincula tu proyecto de Google Cloud**
   - Busca la opción para "Vincular proyecto de Google Cloud" o "Link Google Cloud Project"
   - Ingresa tu ID de proyecto: `products-management-473007`
   - Confirma la vinculación

4. **Verifica los permisos**
   - Asegúrate de que tu cuenta de Google tenga los permisos necesarios
   - El email usado debe tener rol de administrador o desarrollador API en Merchant Center

5. **Espera la propagación**
   - Los cambios pueden tardar hasta 5 minutos en propagarse
   - Después de este tiempo, tu aplicación debería poder acceder a los datos

## Verificación

Para verificar que todo funciona correctamente:

1. Inicia tu servidor: `npm run dev`
2. Autentícate en http://localhost:3000
3. Autoriza el scope de Merchant si es necesario
4. Ve a http://localhost:3000/products
5. Deberías ver las cuentas merchant disponibles en el dropdown

## Notas Importantes sobre las APIs

### Nueva API de Merchant (la que estamos usando)
- **Productos**: `@google-shopping/products`
- **Cuentas**: `@google-shopping/accounts`
- **Data Sources**: `@google-shopping/datasources`

Estas son las APIs modernas y recomendadas por Google.

### API Antigua (Content API v2.1)
- Usa `googleapis` con `google.content('v2.1')`
- Está siendo deprecada gradualmente
- NO mezclar con las nuevas APIs

## Diferencias clave entre las APIs

1. **Estructura de nombres**:
   - Nueva: `accounts/123456789`
   - Antigua: Solo el ID numérico

2. **Autenticación**:
   - Ambas usan OAuth2
   - Las nuevas APIs requieren vinculación explícita del proyecto GCP

3. **Métodos disponibles**:
   - La nueva API separa funcionalidades en diferentes paquetes
   - La antigua tenía todo en un solo servicio

## Troubleshooting

Si continúas teniendo problemas:

1. **Verifica el ID del proyecto**:
   ```bash
   gcloud config get-value project
   ```

2. **Confirma que las APIs están habilitadas**:
   - Ve a https://console.cloud.google.com
   - Navega a "APIs y servicios" > "APIs habilitadas"
   - Busca "Merchant API"

3. **Revisa los logs del servidor** para mensajes de error específicos

4. **Verifica los scopes**:
   - El scope correcto es: `https://www.googleapis.com/auth/content`

## Referencias

- [Documentación oficial de Merchant API](https://developers.google.com/merchant/api)
- [Guía de autorización](https://developers.google.com/merchant/api/guides/authorization)
- [Migración de Content API a Merchant API](https://developers.google.com/merchant/api/guides/migration)