<?php

namespace App\Http\Controllers\Audit;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function adminIndex(Request $request)
    {
        $filters = $request->validate([
            'subject_type' => ['nullable', 'string', 'max:100'],
            'subject_id' => ['nullable', 'integer', 'min:1'],
            'action' => ['nullable', 'string', 'max:100'],
            'actor_id' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->paginate($this->applyFilters(
                AuditLog::query()->with('actor:id,name,email'),
                $filters
            ), (int) ($filters['per_page'] ?? 15)),
        ]);
    }

    public function myActivity(Request $request)
    {
        $userId = (int) $request->user()->id;

        $query = AuditLog::query()
            ->with('actor:id,name,email')
            ->where(function (Builder $builder) use ($userId) {
                $builder->where(function (Builder $subjectQuery) use ($userId) {
                    $subjectQuery->where('subject_type', 'user')
                        ->where('subject_id', $userId);
                })->orWhere('context->seller_id', $userId)
                    ->orWhere('context->buyer_id', $userId);
            });

        return response()->json([
            'success' => true,
            'data' => $this->paginate($query, 20),
        ]);
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['subject_type'] ?? null, fn (Builder $q, $value) =>
                $q->where('subject_type', $value))
            ->when($filters['subject_id'] ?? null, fn (Builder $q, $value) =>
                $q->where('subject_id', $value))
            ->when($filters['action'] ?? null, fn (Builder $q, $value) =>
                $q->where('action', $value))
            ->when($filters['actor_id'] ?? null, fn (Builder $q, $value) =>
                $q->where('actor_id', $value));
    }

    private function paginate(Builder $query, int $perPage): array
    {
        $paginator = $query->latest('id')->paginate($perPage);

        return [
            'logs' => $paginator->getCollection()->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'action' => $log->action,
                'from_status' => $log->from_status,
                'to_status' => $log->to_status,
                'reason' => $log->reason,
                'context' => $log->context,
                'ip_address' => $log->ip_address,
                'created_at' => optional($log->created_at)->format('d/m/Y H:i:s'),
                'actor' => $log->actor ? [
                    'id' => $log->actor->id,
                    'name' => $log->actor->name,
                    'email' => $log->actor->email,
                ] : null,
            ])->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
            ],
        ];
    }
}
