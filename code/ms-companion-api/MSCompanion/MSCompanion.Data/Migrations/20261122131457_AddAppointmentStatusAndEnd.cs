using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSCompanion.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentStatusAndEnd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ends_at",
                table: "appointment",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "appointment",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Booked");

            migrationBuilder.AddCheckConstraint(
                name: "ck_appointment_status",
                table: "appointment",
                sql: "status IN ('Booked', 'Fulfilled', 'Cancelled', 'NoShow')");

            migrationBuilder.AddCheckConstraint(
                name: "ck_appointment_times",
                table: "appointment",
                sql: "ends_at IS NULL OR ends_at > starts_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_appointment_status",
                table: "appointment");

            migrationBuilder.DropCheckConstraint(
                name: "ck_appointment_times",
                table: "appointment");

            migrationBuilder.DropColumn(
                name: "ends_at",
                table: "appointment");

            migrationBuilder.DropColumn(
                name: "status",
                table: "appointment");
        }
    }
}
