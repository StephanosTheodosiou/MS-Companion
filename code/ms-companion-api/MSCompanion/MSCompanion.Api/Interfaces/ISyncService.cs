using MSCompanion.Api.Dto;
using MSCompanion.Api.Services;

namespace MSCompanion.Api.Interfaces;

public interface ISyncService
{
    Task<SyncPushResponse?> PushAsync(Guid userId, SyncPushRequest request, CancellationToken ct = default);

    Task<SyncPullResponse?> PullAsync(Guid userId, SyncCursor? after, int limit, CancellationToken ct = default);
}
