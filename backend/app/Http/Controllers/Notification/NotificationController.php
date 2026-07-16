<?php

namespace App\Http\Controllers\Notification;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'unread_only' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ]);

        $query = $request->boolean('unread_only')
            ? $request->user()->unreadNotifications()
            : $request->user()->notifications();

        $paginator = $query
            ->latest('created_at')
            ->paginate((int) ($validated['per_page'] ?? 10));

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $paginator->getCollection()
                    ->map(fn ($notification) => [
                        'id' => $notification->id,
                        'type' => $notification->data['event_type'] ?? class_basename($notification->type),
                        'title' => $notification->data['title'] ?? 'Thông báo',
                        'message' => $notification->data['message'] ?? '',
                        'url' => $notification->data['url'] ?? null,
                        'actor' => $notification->data['actor'] ?? null,
                        'context' => $notification->data['context'] ?? [],
                        'read_at' => optional($notification->read_at)->toISOString(),
                        'created_at' => optional($notification->created_at)->format('d/m/Y H:i'),
                    ])->values(),
                'unread_count' => $request->user()->unreadNotifications()->count(),
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Đã đọc thông báo.',
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đọc tất cả thông báo.',
        ]);
    }
}
