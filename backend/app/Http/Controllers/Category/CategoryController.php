<?php

namespace App\Http\Controllers\Category;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Services\Category\CategoryService;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        private CategoryService $service
    ) {}

    // ================= PUBLIC =================

    // Danh sách danh mục đang hiển thị
    public function index(Request $request)
    {
        $limit = max(
            1,
            min((int) $request->input('limit', 10), 50)
        );

        $data = $this->service->getAll($limit);

        return response()->json([
            'success' => true,
            'data' => $data->items(),
            'meta' => [
                'total' => $data->total(),
                'per_page' => $data->perPage(),
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ],
        ]);
    }

    // Chi tiết danh mục đang hiển thị
    public function show($slug)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->getBySlug($slug),
        ]);
    }

    // ================= ADMIN =================

    // Danh sách admin, gồm cả xóa mềm
    public function adminIndex(Request $request)
    {
        $filters = [
            'limit' => max(
                1,
                min((int) $request->input('limit', 10), 50)
            ),
            'keyword' => $request->input('keyword'),
            'status' => $request->input('status'),
            'deleted' => $request->input('deleted'),
        ];

        $data = $this->service->adminGetAll($filters);

        return response()->json([
            'success' => true,
            'data' => $data->items(),
            'meta' => [
                'total' => $data->total(),
                'per_page' => $data->perPage(),
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'from' => $data->firstItem(),
                'to' => $data->lastItem(),
            ],
        ]);
    }

    // Chi tiết admin, gồm cả xóa mềm
    public function adminShow($id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->adminGetById($id),
        ]);
    }

    // Tạo danh mục
    public function store(StoreCategoryRequest $request)
    {
        $category = $this->service->create(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Tạo danh mục thành công.',
            'data' => $category,
        ], 201);
    }

    // Cập nhật danh mục
    public function update(
        UpdateCategoryRequest $request,
        $id
    ) {
        $category = $this->service->update(
            $id,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật danh mục thành công.',
            'data' => $category,
        ]);
    }

    // Đổi trạng thái hiển thị
    public function toggleStatus($id)
    {
        $data = $this->service->toggleStatus($id);

        return response()->json([
            'success' => true,
            'message' => $data['message'],
            'data' => $data,
        ]);
    }

    // Xóa mềm
    public function destroy($id)
    {
        $category = $this->service->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Xóa danh mục thành công.',
            'data' => $category,
        ]);
    }

    // Khôi phục
    public function restore($id)
    {
        $category = $this->service->restore($id);

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục danh mục thành công.',
            'data' => $category,
        ]);
    }

    // Xóa vĩnh viễn
    public function forceDestroy($id)
    {
        $category = $this->service->forceDelete($id);

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn danh mục thành công.',
            'data' => $category,
        ]);
    }
}
