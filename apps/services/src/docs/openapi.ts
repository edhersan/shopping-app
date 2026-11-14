export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Shopping Services API",
    version: "1.0.0",
    description: [
      "Microservicios serverless para catálogo, carrito, órdenes y pago simulado.",
      "",
      "Reglas de negocio: impuesto del 8%, envío de $5.99 (gratis desde $100) y máximo de 99 unidades por línea.",
      "El pago es simulado: las tarjetas terminadas en 0000 se rechazan con HTTP 402.",
      "Login y registro emiten un JWT firmado con HS256. Los endpoints admin requieren Authorization: Bearer <token>.",
      "JWT_SECRET debe estar configurado y tener al menos 32 caracteres.",
      "Las órdenes, los usuarios y el stock viven en memoria y se reinician en cada cold start.",
    ].join("\n"),
    contact: {
      name: "Shopping App",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    { url: "/api", description: "Servidor actual (mismo origen)" },
    {
      url: "https://<tu-proyecto>.vercel.app/api",
      description: "Producción en Vercel (reemplaza el subdominio)",
    },
  ],
  tags: [
    { name: "Sistema", description: "Salud y documentación" },
    { name: "Catálogo", description: "Productos disponibles" },
    { name: "Carrito", description: "Validación de precios y stock" },
    { name: "Órdenes", description: "Checkout y pago simulado" },
    { name: "Usuarios", description: "Registro e inicio de sesión" },
    { name: "Administración", description: "Panel de administrador" },
  ],
  security: [],
  paths: {
    "/health": {
      get: {
        tags: ["Sistema"],
        operationId: "getHealth",
        summary: "Estado del servicio",
        responses: {
          "200": {
            description: "Servicio activo",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Catálogo"],
        operationId: "listProducts",
        summary: "Lista el catálogo de productos",
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            description: "Texto a buscar en nombre y descripción.",
            schema: { type: "string" },
            example: "aurora",
          },
          {
            name: "category",
            in: "query",
            required: false,
            description: "Filtra por categoría. Usa `all` o vacío para todas.",
            schema: {
              type: "string",
              enum: ["all", "electronics", "clothing", "home", "sports"],
            },
            example: "electronics",
          },
        ],
        responses: {
          "200": {
            description: "Listado de productos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductListResponse" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Catálogo"],
        operationId: "getProductById",
        summary: "Obtiene un producto por su identificador",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Identificador del producto (por ejemplo, p-001).",
            schema: { type: "string" },
            example: "p-001",
          },
        ],
        responses: {
          "200": {
            description: "Producto encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductResponse" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/cart/validate": {
      post: {
        tags: ["Carrito"],
        operationId: "validateCart",
        summary: "Valida stock y calcula los totales del carrito",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CartItemsRequest" },
              example: {
                items: [
                  { productId: "p-001", quantity: 2 },
                  { productId: "p-005", quantity: 1 },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Totales calculados por el servidor",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PricingSummaryResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/orders": {
      post: {
        tags: ["Órdenes"],
        operationId: "createOrder",
        summary: "Crea una orden y simula el pago",
        description:
          "Recalcula los precios en el servidor, valida el stock y, si el pago es aprobado, descuenta las unidades. Las tarjetas terminadas en 0000 reciben HTTP 402.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" },
              example: {
                items: [{ productId: "p-005", quantity: 1 }],
                customer: {
                  fullName: "Ana Torres",
                  email: "ana@example.com",
                  address: "Calle 123 # 45-67",
                  city: "Bogotá",
                  zipCode: "110111",
                },
                payment: {
                  cardNumber: "4111111111111111",
                  holderName: "Ana Torres",
                  expiry: "12/30",
                  cvv: "123",
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Orden creada y pago aprobado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "402": { $ref: "#/components/responses/PaymentDeclined" },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Órdenes"],
        operationId: "getOrderById",
        summary: "Consulta una orden por su identificador",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Identificador de la orden (por ejemplo, ord_abc123).",
            schema: { type: "string" },
            example: "ord_9860d85368b8",
          },
        ],
        responses: {
          "200": {
            description: "Orden encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderResponse" },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Usuarios"],
        operationId: "registerUser",
        summary: "Registra un nuevo usuario cliente",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                fullName: "Ana Torres",
                username: "ana.torres",
                email: "ana@example.com",
                password: "secreto123",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado y sesión JWT emitida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSessionResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
          "409": { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Usuarios"],
        operationId: "loginUser",
        summary: "Inicia sesión con usuario y contraseña",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: { username: "admin", password: "admin123" },
            },
          },
        },
        responses: {
          "200": {
            description: "Credenciales válidas y sesión JWT emitida",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthSessionResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Administración"],
        operationId: "listUsers",
        summary: "Lista los usuarios registrados (solo admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Listado de usuarios",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserListResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/admin/users/{id}": {
      delete: {
        tags: ["Administración"],
        operationId: "deleteUser",
        summary: "Elimina un usuario que no sea administrador (solo admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Identificador del usuario.",
            schema: { type: "string" },
            example: "usr_1a2b3c4d5e6f",
          },
        ],
        responses: {
          "200": {
            description: "Usuario eliminado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
          "409": {
            description: "El usuario es administrador y no se puede eliminar",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: {
                    code: "CANNOT_DELETE_ADMIN",
                    message: "No se puede eliminar a un usuario administrador.",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/orders": {
      get: {
        tags: ["Administración"],
        operationId: "listOrders",
        summary: "Lista todas las órdenes (solo admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Listado de órdenes",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderListResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/admin/products/{id}/stock": {
      post: {
        tags: ["Administración"],
        operationId: "updateProductStock",
        summary: "Actualiza el stock de un producto (solo admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Identificador del producto.",
            schema: { type: "string" },
            example: "p-001",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateStockRequest" },
              example: { stock: 30 },
            },
          },
        },
        responses: {
          "200": {
            description: "Producto actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "403": { $ref: "#/components/responses/Forbidden" },
          "404": { $ref: "#/components/responses/NotFound" },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/docs": {
      get: {
        tags: ["Sistema"],
        operationId: "getSwaggerUi",
        summary: "Documentación interactiva (Swagger UI)",
        responses: {
          "200": {
            description: "Página HTML con Swagger UI",
            content: {
              "text/html": {
                schema: { type: "string" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
    "/openapi": {
      get: {
        tags: ["Sistema"],
        operationId: "getOpenApiDocument",
        summary: "Especificación OpenAPI 3.0 en JSON",
        responses: {
          "200": {
            description: "Documento OpenAPI",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          "405": { $ref: "#/components/responses/MethodNotAllowed" },
        },
      },
    },
  },
  components: {
    schemas: {
      Product: {
        type: "object",
        required: [
          "id",
          "name",
          "description",
          "price",
          "currency",
          "category",
          "imageUrl",
          "stock",
          "rating",
        ],
        properties: {
          id: { type: "string", example: "p-001" },
          name: { type: "string", example: "Aurora Wireless Headphones" },
          description: {
            type: "string",
            example: "Audífonos inalámbricos con cancelación activa de ruido.",
          },
          price: { type: "number", format: "double", example: 89.99 },
          currency: { type: "string", enum: ["USD"], example: "USD" },
          category: {
            type: "string",
            enum: ["electronics", "clothing", "home", "sports"],
            example: "electronics",
          },
          imageUrl: {
            type: "string",
            format: "uri",
            example: "https://placehold.co/600x450/1e293b/f8fafc?text=Aurora+Headphones",
          },
          stock: { type: "integer", minimum: 0, example: 24 },
          rating: { type: "number", format: "double", minimum: 0, maximum: 5, example: 4.7 },
        },
      },
      User: {
        type: "object",
        required: ["id", "username", "fullName", "email", "role", "createdAt"],
        properties: {
          id: { type: "string", example: "usr_1a2b3c4d5e6f" },
          username: { type: "string", example: "ana.torres" },
          fullName: { type: "string", example: "Ana Torres" },
          email: { type: "string", format: "email", example: "ana@example.com" },
          role: { type: "string", enum: ["customer", "admin"], example: "customer" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-11-14T15:30:00.000Z",
          },
        },
      },
      AuthSession: {
        type: "object",
        required: ["token", "expiresAt", "user"],
        properties: {
          token: {
            type: "string",
            description: "JWT firmado con HS256.",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            example: "2026-11-14T23:30:00.000Z",
          },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: { type: "string", example: "admin123" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["fullName", "username", "email", "password"],
        properties: {
          fullName: { type: "string", minLength: 3, example: "Ana Torres" },
          username: {
            type: "string",
            pattern: "^[a-zA-Z0-9._-]{3,20}$",
            example: "ana.torres",
          },
          email: { type: "string", format: "email", example: "ana@example.com" },
          password: { type: "string", minLength: 6, example: "secreto123" },
        },
      },
      UpdateStockRequest: {
        type: "object",
        required: ["stock"],
        properties: {
          stock: { type: "integer", minimum: 0, maximum: 999, example: 30 },
        },
      },
      OrderLineInput: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", example: "p-001" },
          quantity: { type: "integer", minimum: 1, maximum: 99, example: 2 },
        },
      },
      CartItemsRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderLineInput" },
          },
        },
      },
      PricedCartItem: {
        type: "object",
        required: ["productId", "name", "imageUrl", "unitPrice", "quantity", "lineTotal"],
        properties: {
          productId: { type: "string", example: "p-001" },
          name: { type: "string", example: "Aurora Wireless Headphones" },
          imageUrl: { type: "string", format: "uri" },
          unitPrice: { type: "number", format: "double", example: 89.99 },
          quantity: { type: "integer", example: 2 },
          lineTotal: { type: "number", format: "double", example: 179.98 },
        },
      },
      PricingSummary: {
        type: "object",
        required: ["items", "subtotal", "tax", "shipping", "total", "currency"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/PricedCartItem" },
          },
          subtotal: { type: "number", format: "double", example: 179.98 },
          tax: { type: "number", format: "double", example: 14.4 },
          shipping: { type: "number", format: "double", example: 0 },
          total: { type: "number", format: "double", example: 194.38 },
          currency: { type: "string", enum: ["USD"], example: "USD" },
        },
      },
      Customer: {
        type: "object",
        required: ["fullName", "email", "address", "city", "zipCode"],
        properties: {
          fullName: { type: "string", minLength: 3, example: "Ana Torres" },
          email: { type: "string", format: "email", example: "ana@example.com" },
          address: { type: "string", minLength: 5, example: "Calle 123 # 45-67" },
          city: { type: "string", minLength: 2, example: "Bogotá" },
          zipCode: {
            type: "string",
            pattern: "^[0-9A-Za-z -]{3,10}$",
            example: "110111",
          },
        },
      },
      PaymentRequest: {
        type: "object",
        required: ["cardNumber", "holderName", "expiry", "cvv"],
        properties: {
          cardNumber: {
            type: "string",
            pattern: "^\\d{13,19}$",
            example: "4111111111111111",
            description: "Solo dígitos. Las tarjetas terminadas en 0000 se rechazan.",
          },
          holderName: { type: "string", minLength: 3, example: "Ana Torres" },
          expiry: {
            type: "string",
            pattern: "^(0[1-9]|1[0-2])/[0-9]{2}$",
            example: "12/30",
          },
          cvv: { type: "string", pattern: "^\\d{3,4}$", example: "123" },
        },
      },
      CreateOrderRequest: {
        type: "object",
        required: ["items", "customer", "payment"],
        properties: {
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/OrderLineInput" },
          },
          customer: { $ref: "#/components/schemas/Customer" },
          payment: { $ref: "#/components/schemas/PaymentRequest" },
        },
      },
      PaymentSummary: {
        type: "object",
        required: ["brand", "last4", "approved"],
        properties: {
          brand: { type: "string", example: "Visa" },
          last4: { type: "string", example: "1111" },
          approved: { type: "boolean", example: true },
        },
      },
      Order: {
        type: "object",
        required: [
          "id",
          "customer",
          "items",
          "subtotal",
          "tax",
          "shipping",
          "total",
          "currency",
          "status",
          "payment",
          "createdAt",
        ],
        properties: {
          id: { type: "string", example: "ord_9860d85368b8" },
          customer: { $ref: "#/components/schemas/Customer" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/PricedCartItem" },
          },
          subtotal: { type: "number", format: "double", example: 54.99 },
          tax: { type: "number", format: "double", example: 4.4 },
          shipping: { type: "number", format: "double", example: 5.99 },
          total: { type: "number", format: "double", example: 65.38 },
          currency: { type: "string", enum: ["USD"], example: "USD" },
          status: { type: "string", enum: ["paid", "declined"], example: "paid" },
          payment: { $ref: "#/components/schemas/PaymentSummary" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-11-07T15:30:00.000Z",
          },
        },
      },
      HealthPayload: {
        type: "object",
        required: ["status", "service", "timestamp"],
        properties: {
          status: { type: "string", enum: ["ok"], example: "ok" },
          service: { type: "string", example: "shopping-services" },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-11-07T15:30:00.000Z",
          },
        },
      },
      ApiError: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: {
            type: "string",
            example: "Revisa los datos enviados.",
          },
          details: {
            type: "array",
            items: { type: "string" },
            example: ["El correo electrónico no es válido."],
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", enum: [false], example: false },
          error: { $ref: "#/components/schemas/ApiError" },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/HealthPayload" },
        },
      },
      ProductResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/Product" },
        },
      },
      ProductListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Product" },
          },
        },
      },
      PricingSummaryResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/PricingSummary" },
        },
      },
      OrderResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/Order" },
        },
      },
      UserResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/User" },
        },
      },
      AuthSessionResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: { $ref: "#/components/schemas/AuthSession" },
        },
      },
      UserListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
        },
      },
      OrderListResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: { type: "boolean", enum: [true], example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Order" },
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token devuelto por /auth/login o /auth/register.",
      },
    },
    responses: {
      BadRequest: {
        description: "Datos de entrada inválidos",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Revisa los datos enviados.",
                details: ["El correo electrónico no es válido."],
              },
            },
          },
        },
      },
      NotFound: {
        description: "Recurso no encontrado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "PRODUCT_NOT_FOUND",
                message: "El producto p-999 no existe.",
              },
            },
          },
        },
      },
      Conflict: {
        description: "Stock insuficiente o conflicto de inventario",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "INSUFFICIENT_STOCK",
                message: "Stock insuficiente para Aurora Wireless Headphones.",
                details: ["Disponible: 3, solicitado: 5."],
              },
            },
          },
        },
      },
      PaymentDeclined: {
        description: "Pago simulado rechazado",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "PAYMENT_DECLINED",
                message: "El pago simulado fue rechazado.",
                details: [
                  "La tarjeta terminada en 0000 fue rechazada porque termina en 0000.",
                ],
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Credenciales incorrectas o token ausente, inválido o vencido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "INVALID_TOKEN",
                message: "El token es inválido.",
              },
            },
          },
        },
      },
      Forbidden: {
        description: "El usuario no tiene permisos de administrador",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "No tienes permisos para acceder a este recurso.",
              },
            },
          },
        },
      },
      MethodNotAllowed: {
        description: "Método HTTP no permitido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "METHOD_NOT_ALLOWED",
                message: "Método PUT no permitido. Usa: GET.",
              },
            },
          },
        },
      },
    },
  },
} as const;
