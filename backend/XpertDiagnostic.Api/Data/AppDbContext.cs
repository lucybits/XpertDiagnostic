using Microsoft.EntityFrameworkCore;
using XpertDiagnostic.Api.Models.Entities;

namespace XpertDiagnostic.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
}