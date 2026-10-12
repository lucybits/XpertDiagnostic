using XpertDiagnostic.Api.Models.Entities;
using XpertDiagnostic.Api.Services;

namespace XpertDiagnostic.Tests;

public class PasswordCredentialVerifierTests
{
    [Fact]
    public void VerifyAndUpgrade_LegacyPlaintextPassword_HashesPassword()
    {
        var usuario = CreateUsuario("pass1234");

        var verified = PasswordCredentialVerifier.VerifyAndUpgrade("pass1234", usuario);

        Assert.True(verified);
        Assert.Equal(60, usuario.PasswordHash.Length);
        Assert.StartsWith("$2", usuario.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("pass1234", usuario.PasswordHash));
    }

    [Fact]
    public void VerifyAndUpgrade_WrongLegacyPassword_DoesNotChangeStoredPassword()
    {
        const string storedPassword = "pass1234";
        var usuario = CreateUsuario(storedPassword);

        var verified = PasswordCredentialVerifier.VerifyAndUpgrade("wrongpass", usuario);

        Assert.False(verified);
        Assert.Equal(storedPassword, usuario.PasswordHash);
    }

    [Fact]
    public void VerifyAndUpgrade_BCryptPassword_VerifiesWithoutRehashing()
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("securePass123");
        var usuario = CreateUsuario(passwordHash);

        var verified = PasswordCredentialVerifier.VerifyAndUpgrade("securePass123", usuario);

        Assert.True(verified);
        Assert.Equal(passwordHash, usuario.PasswordHash);
    }

    private static Usuario CreateUsuario(string password) => new()
    {
        Id = 123456,
        PasswordHash = password,
        Rol = "M",
        IdMedico = 123456,
        IdArea = 900001
    };
}
