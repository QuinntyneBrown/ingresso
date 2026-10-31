namespace Ingresso.Application.Common.Exceptions;

/// <summary>The request is valid but conflicts with the current state, such as a limit already reached (HTTP 409).</summary>
public sealed class ConflictException(string message) : Exception(message);
