import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import harvestLotService from "../../services/harvestLotService";

function HarvestLots() {
  const [lots, setLots] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLots = async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const res = await harvestLotService.getHarvestLots({
        page,
        limit: 10,
      });

      setLots(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.error || "Không thể tải danh sách lô.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm("M muốn xóa lô này không?");
    if (!ok) return;

    try {
      await harvestLotService.deleteHarvestLot(id);
      fetchLots(meta?.current_page || 1);
    } catch (err) {
      alert(err.error || "Xóa lô thất bại.");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Quản lý lô sản phẩm</h2>

        <Link to="/seller/harvest-lots/create">
          <button>+ Thêm lô</button>
        </Link>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Mã lô</th>
            <th>Sản phẩm</th>
            <th>Chứng chỉ</th>
            <th>Ngày thu hoạch</th>
            <th>Hạn sử dụng</th>
            <th>SL nhập</th>
            <th>SL còn</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {lots.map((lot) => (
            <tr key={lot.id}>
              <td>{lot.id}</td>
              <td>{lot.lot_code}</td>
              <td>{lot.product?.name}</td>
              <td>{lot.certificate?.certification_name}</td>
              <td>{lot.harvest_date}</td>
              <td>{lot.expiry_date}</td>
              <td>{lot.quantity_imported}</td>
              <td>{lot.quantity_remaining}</td>
              <td>{lot.status_text}</td>
              <td>
                <Link to={`/seller/harvest-lots/${lot.id}/edit`}>
                  <button>Sửa</button>
                </Link>

                <button
                  onClick={() => handleDelete(lot.id)}
                  style={{ marginLeft: 8 }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}

          {!loading && lots.length === 0 && (
            <tr>
              <td colSpan="10" align="center">
                Chưa có lô sản phẩm nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {meta && (
        <div style={{ marginTop: 16 }}>
          <button
            disabled={meta.current_page <= 1}
            onClick={() => fetchLots(meta.current_page - 1)}
          >
            Trang trước
          </button>

          <span style={{ margin: "0 12px" }}>
            Trang {meta.current_page} / {meta.last_page}
          </span>

          <button
            disabled={meta.current_page >= meta.last_page}
            onClick={() => fetchLots(meta.current_page + 1)}
          >
            Trang sau
          </button>
        </div>
      )}
    </div>
  );
}

export default HarvestLots;