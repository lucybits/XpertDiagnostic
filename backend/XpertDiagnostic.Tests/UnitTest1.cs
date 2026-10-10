
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace XpertDiagnostic.Tests;

public class UnitTest1
{
    [Fact]
    public async Task PT02_ContrasenaIncorrecta_DebeRetornar401()
    {
        // Arrange: preparar una solicitud con una contraseña incorrecta.
        using var cliente = new HttpClient();
        var contenido = new StringContent(
            """{"usuarioId":1,"password":"Incorrecta123"}""",
            Encoding.UTF8,
            "application/json"
        );

        // Act: enviar la solicitud a la API.
        var respuesta = await cliente.PostAsync(
            "http://localhost:5140/api/auth/login",
            contenido
        );

        // Assert: verificar que la API rechaza el inicio de sesión.
        Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
    }
}
