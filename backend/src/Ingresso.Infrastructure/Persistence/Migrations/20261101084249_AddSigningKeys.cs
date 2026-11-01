using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ingresso.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSigningKeys : Migration
    {
        /// <inheritdoc />
        // SQLite (Playwright and the tests) has no nvarchar(max), so unbounded columns use TEXT there.
        private string unbounded = "nvarchar(max)";

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            unbounded = migrationBuilder.IsSqlServer() ? "nvarchar(max)" : "TEXT";

            migrationBuilder.CreateTable(
                name: "DataProtectionKeys",
                columns: table => new
                {
                    // SQLite assigns ids only to an INTEGER primary key.
                    Id = table.Column<int>(type: migrationBuilder.IsSqlServer() ? "int" : "INTEGER", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1")
                        .Annotation("Sqlite:Autoincrement", true),
                    FriendlyName = table.Column<string>(type: unbounded, nullable: true),
                    Xml = table.Column<string>(type: unbounded, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataProtectionKeys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SigningKeys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kid = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ProtectedKey = table.Column<string>(type: unbounded, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    RetiredAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SigningKeys", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SigningKeys_Kid",
                table: "SigningKeys",
                column: "Kid",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataProtectionKeys");

            migrationBuilder.DropTable(
                name: "SigningKeys");
        }
    }
}
