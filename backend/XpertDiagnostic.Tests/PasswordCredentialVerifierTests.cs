using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

public class PasswordCredentialVerifierTests
{
    private readonly PasswordCredentialVerifier _verificador = new();

    [Fact]
    public void Verificar_ContrasenaHeredadaCorrecta_DevuelveNuevoHashBCrypt()
    {
        // Given una contraseña heredada guardada en texto plano
        const string guardada = "pass1234";

        // When el usuario escribe la contraseña correcta
        var resultado = _verificador.Verificar("pass1234", guardada);

        // Then es válida y se entrega un hash BCrypt de 60 caracteres para reemplazarla
        Assert.True(resultado.EsValida);
        Assert.NotNull(resultado.HashActualizado);
        Assert.Equal(60, resultado.HashActualizado.Length);
        Assert.StartsWith("$2", resultado.HashActualizado);
        Assert.True(BCrypt.Net.BCrypt.Verify("pass1234", resultado.HashActualizado));
    }

    [Fact]
    public void Verificar_ContrasenaHeredadaIncorrecta_EsInvalidaYNoGeneraHash()
    {
        // Given una contraseña heredada guardada en texto plano
        // When el usuario escribe otra contraseña
        var resultado = _verificador.Verificar("wrongpass", "pass1234");

        // Then es inválida y no hay nada que actualizar
        Assert.False(resultado.EsValida);
        Assert.Null(resultado.HashActualizado);
    }

    [Fact]
    public void Verificar_HashBCryptCorrecto_EsValidaSinRehash()
    {
        // Given una contraseña guardada como hash BCrypt
        var hash = BCrypt.Net.BCrypt.HashPassword("securePass123");

        // When el usuario escribe la contraseña correcta
        var resultado = _verificador.Verificar("securePass123", hash);

        // Then es válida y el hash no se reemplaza
        Assert.True(resultado.EsValida);
        Assert.Null(resultado.HashActualizado);
    }

    [Fact]
    public void Verificar_HashBCryptIncorrecto_EsInvalida()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("securePass123");

        var resultado = _verificador.Verificar("otraClave", hash);

        Assert.False(resultado.EsValida);
    }

    [Fact]
    public void Verificar_HashBCryptCorrupto_EsInvalidaSinLanzar()
    {
        var resultado = _verificador.Verificar("securePass123", "$2a$corrupto");

        Assert.False(resultado.EsValida);
    }

    [Fact]
    public void Verificar_SinValorGuardado_EsInvalida()
    {
        // Given un usuario que no existe (no hay valor guardado)
        // When se verifica cualquier contraseña
        var resultado = _verificador.Verificar("cualquiera", null);

        // Then es inválida
        Assert.False(resultado.EsValida);
    }
}
