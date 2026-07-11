<?php

namespace App\Services\Certification;

use App\Models\Certification;
use Illuminate\Validation\ValidationException;

class CertificationService
{
    // ================= PUBLIC =================

    public function getAll($limit = 10)
    {
        return Certification::where('status', 1)
            ->orderByDesc('created_at')
            ->paginate($limit);
    }

    public function getById($id)
    {
        return Certification::where('status', 1)
            ->findOrFail($id);
    }

    // ================= ADMIN =================

    public function adminGetAll(array $filters)
    {
        return Certification::withTrashed()

            ->when(
                !empty($filters['keyword']),
                function ($query) use ($filters) {
                    $keyword = trim($filters['keyword']);

                    $query->where(function ($q) use ($keyword) {
                        $q->where('name', 'like', "%{$keyword}%")
                            ->orWhere('description', 'like', "%{$keyword}%");
                    });
                }
            )

            ->when(
                $filters['status'] !== null &&
                    $filters['status'] !== '',
                function ($query) use ($filters) {
                    $query->where('status', $filters['status']);
                }
            )

            ->when(
                $filters['deleted'] !== null &&
                    $filters['deleted'] !== '',
                function ($query) use ($filters) {
                    if ((int) $filters['deleted'] === 1) {
                        $query->onlyTrashed();
                    } else {
                        $query->withoutTrashed();
                    }
                }
            )

            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['limit']);
    }

    public function adminGetById($id)
    {
        return Certification::withTrashed()
            ->findOrFail($id);
    }

    // ================= CREATE =================

    public function create(array $data)
    {
        $name = $this->normalizeName($data['name']);

        $this->checkDuplicateName($name);

        return Certification::create([
            'name' => $name,
            'description' => $data['description'] ?? null,
            'status' => $data['status'] ?? 1,
        ]);
    }

    // ================= UPDATE =================

    public function update($id, array $data)
    {
        $certification = Certification::withTrashed()
            ->findOrFail($id);

        if ($certification->trashed()) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Chứng chỉ đã bị xóa. Vui lòng khôi phục trước khi chỉnh sửa.',
                ],
            ]);
        }

        if (array_key_exists('name', $data)) {
            $name = $this->normalizeName($data['name']);

            $this->checkDuplicateName(
                $name,
                $certification->id
            );

            $data['name'] = $name;
        }

        $certification->update($data);

        return $certification->fresh();
    }

    // ================= TOGGLE STATUS =================

    public function toggleStatus($id)
    {
        $certification = Certification::withTrashed()
            ->findOrFail($id);

        if ($certification->trashed()) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Chứng chỉ đã bị xóa. Vui lòng khôi phục trước khi thao tác.',
                ],
            ]);
        }

        $certification->status =
            (int) $certification->status === 1 ? 0 : 1;

        $certification->save();

        return [
            'id' => $certification->id,
            'status' => $certification->status,
            'message' => $certification->status === 1
                ? 'Đã hiển thị chứng chỉ.'
                : 'Đã ẩn chứng chỉ.',
        ];
    }

    // ================= SOFT DELETE =================

    public function delete($id)
    {
        $certification = Certification::withTrashed()
            ->findOrFail($id);

        if ($certification->trashed()) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Chứng chỉ đã bị xóa.',
                ],
            ]);
        }

        $certification->delete();

        return $certification;
    }

    // ================= RESTORE =================

    public function restore($id)
    {
        $certification = Certification::withTrashed()
            ->findOrFail($id);

        if (!$certification->trashed()) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Chứng chỉ chưa bị xóa.',
                ],
            ]);
        }

        $certification->restore();

        return $certification->fresh();
    }

    // ================= FORCE DELETE =================

    public function forceDelete($id)
    {
        $certification = Certification::withTrashed()
            ->findOrFail($id);

        if (!$certification->trashed()) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Vui lòng xóa mềm chứng chỉ trước khi xóa vĩnh viễn.',
                ],
            ]);
        }

        if (
            $certification->productCertificates()
            ->withTrashed()
            ->exists()
        ) {
            throw ValidationException::withMessages([
                'certification' => [
                    'Không thể xóa vì chứng chỉ đang được sản phẩm sử dụng.',
                ],
            ]);
        }

        $certification->forceDelete();

        return $certification;
    }

    // ================= HELPERS =================

    private function normalizeName(string $name): string
    {
        return preg_replace(
            '/\s+/u',
            ' ',
            trim($name)
        );
    }

    private function normalizeNameForComparison(string $name): string
    {
        return mb_strtolower(
            $this->normalizeName($name),
            'UTF-8'
        );
    }

    private function checkDuplicateName(
        string $name,
        ?int $ignoreId = null
    ): void {
        $normalizedName =
            $this->normalizeNameForComparison($name);

        $exists = Certification::withTrashed()
            ->when(
                $ignoreId !== null,
                fn($query) => $query->where(
                    'id',
                    '!=',
                    $ignoreId
                )
            )
            ->get(['id', 'name'])
            ->contains(function ($certification) use ($normalizedName) {
                return $this->normalizeNameForComparison(
                    $certification->name
                ) === $normalizedName;
            });

        if ($exists) {
            throw ValidationException::withMessages([
                'name' => [
                    'Tên chứng chỉ đã tồn tại.',
                ],
            ]);
        }
    }
}
