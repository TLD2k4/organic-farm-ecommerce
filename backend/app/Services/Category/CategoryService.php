<?php

namespace App\Services\Category;

use App\Models\Category;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public function getAll($limit = 10)
    {
        return Category::visible()->with([
            'activeChildren' => function ($q) {
                $q->where('status', 1)
                    ->whereNull('deleted_at')
                    ->orderBy('name');
            }
        ])
            ->whereNull('parent_id')
            ->orderBy('name')
            ->paginate($limit);
    }

    public function getBySlug(string $slug)
    {
        return Category::visible()->with([
            'activeChildren' => function ($query) {
                $query->orderBy('name');
            }
        ])
            ->where('slug', $slug)
            ->firstOrFail();
    }

    public function adminGetAll(array $filters)
    {
        return Category::withTrashed()
            ->with('parent')

            ->when(
                !empty($filters['keyword']),
                function ($query) use ($filters) {

                    $keyword = $filters['keyword'];

                    $query->where(function ($q) use ($keyword) {
                        $q->where('name', 'like', "%{$keyword}%")
                            ->orWhere('slug', 'like', "%{$keyword}%")
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

                    if ($filters['deleted'] == 1) {
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
        return Category::withTrashed()
            ->with(['parent', 'children'])
            ->findOrFail($id);
    }

    public function create(array $data)
    {
        if (!empty($data['parent_id'])) {

            $parent = Category::find($data['parent_id']);

            if (!$parent) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Danh mục cha không tồn tại.'
                    ]
                ]);
            }
        }

        $name = $this->normalizeName($data['name']);

        $this->checkDuplicateName($name);

        return Category::create([
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $name,
            'slug' => $this->generateUniqueSlug($name),
            'description' => $data['description'] ?? null,
            'image' => $data['image'] ?? null,
            'status' => $data['status'] ?? 1,
        ]);
    }

    private function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {

        $slug = Str::slug($name);

        $original = $slug;

        $counter = 2;

        while (
            Category::withTrashed()

            ->when(
                $ignoreId,
                fn($q) => $q->where('id', '!=', $ignoreId)
            )

            ->where('slug', $slug)

            ->exists()
        ) {

            $slug = $original . '-' . $counter;

            $counter++;
        }

        return $slug;
    }

    public function update($id, array $data)
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->trashed()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Danh mục đã bị xóa. Vui lòng khôi phục trước khi chỉnh sửa.'
                ],
            ]);
        }

        // Kiểm tra parent
        if (!empty($data['parent_id'])) {

            $parent = Category::withTrashed()->findOrFail($data['parent_id']);

            if ($parent->trashed()) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Danh mục cha đã bị xóa.'
                    ],
                ]);
            }

            if ($parent->id == $category->id) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Không thể chọn chính danh mục này làm danh mục cha.'
                    ],
                ]);
            }

            if ($this->isDescendant($parent, $category->id)) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Không thể tạo vòng lặp danh mục.'
                    ],
                ]);
            }
        }

        if (isset($data['name'])) {

            $name = $this->normalizeName($data['name']);

            if ($name !== $category->name) {

                $this->checkDuplicateName(
                    $name,
                    $category->id
                );

                $data['slug'] = $this->generateUniqueSlug(
                    $name,
                    $category->id
                );
            }

            $data['name'] = $name;
        }

        $category->update($data);

        return $category;
    }

    public function toggleStatus($id)
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->trashed()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Danh mục đã bị xóa. Vui lòng khôi phục trước khi thao tác.'
                ],
            ]);
        }

        $category->status = $category->status ? 0 : 1;
        $category->save();

        return [
            'id' => $category->id,
            'status' => $category->status,
            'message' => $category->status
                ? 'Đã hiển thị danh mục.'
                : 'Đã ẩn danh mục.',
        ];
    }

    public function delete($id)
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->trashed()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Danh mục đã bị xóa.'
                ],
            ]);
        }

        if ($category->children()->exists()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Không thể xóa vì danh mục vẫn còn danh mục con.'
                ],
            ]);
        }

        if ($category->products()->withTrashed()->exists()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Không thể xóa vì đang có sản phẩm thuộc danh mục này.'
                ],
            ]);
        }

        $category->delete();

        return $category;
    }

    public function restore($id)
    {
        $category = Category::withTrashed()->findOrFail($id);

        if (!$category->trashed()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Danh mục chưa bị xóa.'
                ],
            ]);
        }

        if ($category->parent_id) {

            $parent = Category::withTrashed()->find($category->parent_id);

            if (!$parent) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Danh mục cha không còn tồn tại.'
                    ],
                ]);
            }

            if ($parent->trashed()) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Vui lòng khôi phục danh mục cha trước.'
                    ],
                ]);
            }
        }

        $category->restore();

        return $category;
    }

    public function forceDelete($id)
    {
        $category = Category::withTrashed()->findOrFail($id);

        if (!$category->trashed()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Vui lòng xóa mềm trước khi xóa vĩnh viễn.'
                ],
            ]);
        }

        if ($category->children()->withTrashed()->exists()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Không thể xóa vì vẫn còn danh mục con.'
                ],
            ]);
        }

        if ($category->products()->withTrashed()->exists()) {
            throw ValidationException::withMessages([
                'category' => [
                    'Không thể xóa vì vẫn còn sản phẩm thuộc danh mục.'
                ],
            ]);
        }

        $category->forceDelete();

        return $category;
    }

    private function isDescendant(Category $parent, int $categoryId): bool
    {
        while ($parent) {

            if ($parent->id == $categoryId) {
                return true;
            }

            $parent = $parent->parent;
        }

        return false;
    }

    private function normalizeName(string $name): string
    {
        $name = preg_replace('/\s+/u', ' ', trim($name));

        return Str::title(
            mb_strtolower($name)
        );
    }

    private function checkDuplicateName(
        string $name,
        ?int $ignoreId = null
    ): void {

        $normalized = $this->normalizeName($name);

        $exists = Category::withTrashed()
            ->when(
                $ignoreId,
                fn($q) => $q->where('id', '!=', $ignoreId)
            )
            ->get()
            ->contains(function ($category) use ($normalized) {
                return $this->normalizeName($category->name)
                    === $normalized;
            });

        if ($exists) {

            throw ValidationException::withMessages([
                'name' => [
                    'Tên danh mục đã tồn tại.'
                ],
            ]);
        }
    }
}
