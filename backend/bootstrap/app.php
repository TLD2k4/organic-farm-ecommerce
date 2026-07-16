<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Illuminate\Http\Middleware\HandleCors;
use App\Http\Middleware\EnsureSellerPolicyAccepted;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(HandleCors::class);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'seller.policy' => EnsureSellerPolicyAccepted::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Dữ liệu gửi lên không hợp lệ',
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

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Bạn không có quyền thực hiện chức năng này.',
                ], 403);
            }
        });

        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Không tìm thấy dữ liệu yêu cầu.',
                ], 404);
            }
        });

        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage() ?: 'Không thể thực hiện yêu cầu.',
                ], $e->getStatusCode());
            }
        });

        $exceptions->render(function (QueryException $e, Request $request) {
            if ($request->is('api/*')) {
                $errorId = (string) \Illuminate\Support\Str::uuid();
                logger()->error('Database query failed', [
                    'error_id' => $errorId,
                    'exception' => $e,
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'Không thể xử lý dữ liệu lúc này. Vui lòng thử lại.',
                    'code' => 'DATABASE_QUERY_ERROR',
                    'error_id' => $errorId,
                ], 500);
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*')) {

                logger()->error($e);

                return response()->json([
                    'success' => false,
                    'error' => 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.',
                ], 500);
            }
        });
    })->create();
