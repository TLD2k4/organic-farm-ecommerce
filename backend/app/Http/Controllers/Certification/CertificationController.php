<?php

namespace App\Http\Controllers\Certification;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certification\StoreCertificationRequest;
use App\Http\Requests\Certification\UpdateCertificationRequest;
use App\Services\Certification\CertificationService;
use Illuminate\Http\Request;

class CertificationController extends Controller
{
    public function __construct(
        private CertificationService $service
    ) {}

    // PUBLIC: xem danh sách
    public function index(Request $request)
    {
        $limit = max(1, min((int) $request->input('limit', 10), 50));

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

    // PUBLIC: xem chi tiết
    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->getById($id),
        ]);
    }

    // ADMIN: xem danh sách kể cả xóa mềm
    public function adminIndex(Request $request)
    {
        $filters = [
            'limit' => max(1, min((int) $request->input('limit', 10), 50)),
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

    // ADMIN: xem chi tiết kể cả xóa mềm
    public function adminShow($id)
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->adminGetById($id),
        ]);
    }

    // ADMIN: tạo
    public function store(StoreCertificationRequest $request)
    {
        $data = $this->service->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tạo chứng chỉ thành công',
            'data' => $data
        ], 201);
    }

    // ADMIN: update
    public function update(UpdateCertificationRequest $request, $id)
    {
        $data = $this->service->update($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật chứng chỉ thành công',
            'data' => $data
        ], 200);
    }

    // ADMIN: toggle status
    public function toggleStatus($id)
    {
        // Lấy dữ liệu từ Service trả về
        $data = $this->service->toggleStatus($id);

        // Trả về response cấu trúc chuẩn có message nằm ở ngoài
        return response()->json([
            'success' => true,
            'message' => $data['message'], // Đưa message ra ngoài để FE bắt được thông báo Toast/Alert
            'data' => $data,
        ]);
    }

    // ADMIN: xóa mềm
    public function destroy($id)
    {
        $cert = $this->service->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Xóa chứng chỉ thành công (xóa mềm).',
            'data' => $cert,
        ]);
    }

    // ADMIN: xóa vĩnh viễn
    public function forceDestroy($id)
    {
        $cert = $this->service->forceDelete($id);

        return response()->json([
            'success' => true,
            'message' => 'Xóa vĩnh viễn chứng chỉ thành công.',
            'data' => $cert,
        ]);
    }

    // ADMIN: khôi phục
    public function restore($id)
    {
        $cert = $this->service->restore($id);

        return response()->json([
            'success' => true,
            'message' => 'Khôi phục chứng chỉ thành công.',
            'data' => $cert,
        ]);
    }
}
