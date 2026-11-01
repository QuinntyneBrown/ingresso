using Ingresso.Domain.Entities;

namespace Ingresso.Application.Common.Interfaces;

/// <summary>Makes a new signing key, its private key already encrypted for storage (L2-139).</summary>
public interface ISigningKeyFactory
{
    SigningKey Create(DateTimeOffset now);
}
