<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Illuminate\Http\Middleware\HandleCors;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(HandleCors::class);
        
        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);
    })
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (ValidationException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'error' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors(),
            ], 400);
        }
    });

    $exceptions->render(function (AuthenticationException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'error' => 'Bạn chưa đăng nhập hoặc token không hợp lệ.',
            ], 401);
        }
    });

    $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'success' => false,
                'error' => 'Không tìm thấy tài nguyên với ID yêu cầu.',
            ], 404);
        }
    });
})->create();
