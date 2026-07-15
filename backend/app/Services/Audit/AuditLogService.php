<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;

class AuditLogService
{
    public function record(
        User $actor,
        string $subjectType,
        int $subjectId,
        string $action,
        int|string|null $fromStatus = null,
        int|string|null $toStatus = null,
        ?string $reason = null,
        array $context = []
    ): AuditLog {
        return AuditLog::create([
            'actor_id' => $actor->id,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'action' => $action,
            'from_status' => $fromStatus !== null ? (string) $fromStatus : null,
            'to_status' => $toStatus !== null ? (string) $toStatus : null,
            'reason' => $reason ? trim($reason) : null,
            'context' => $context ?: null,
            'ip_address' => request()?->ip(),
            'user_agent' => mb_substr((string) request()?->userAgent(), 0, 500),
        ]);
    }
}
