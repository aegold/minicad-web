# Đặc Tả Định Dạng Dữ Liệu MiniCAD

## Tổng Quan

Web sử dụng định dạng JSON dạng đồ thị để biểu diễn mặt bằng. Tất cả đo đạc đều tính bằng **milimét (mm)**.

## Cấu Trúc Gốc

```json
{
  "units": "mm",
  "vertices": {},
  "walls": {},
  "rooms": {},
  "symbols": {},
  "instances": {}
}
```

## 1. Vertices (Đỉnh)

Các điểm góc và điểm kết nối. Gốc tọa độ ở góc trên-trái (0,0), trục X sang phải, trục Y xuống dưới.

```json
"vertices": {
  "v1": { "x": 0, "y": 0 },
  "v2": { "x": 6000, "y": 0 },
  "v3": { "x": 6000, "y": 4000 }
}
```

**Các trường:**

- `x` (số, bắt buộc): Tọa độ X tính bằng mm
- `y` (số, bắt buộc): Tọa độ Y tính bằng mm

## 2. Walls (Tường)

Các cạnh kết nối hai đỉnh.

```json
"walls": {
  "w1": {
    "vStart": "v1",
    "vEnd": "v2",
    "thickness": 200,
    "isOuter": true
  }
}
```

**Các trường:**

- `vStart` (chuỗi, bắt buộc): ID đỉnh bắt đầu
- `vEnd` (chuỗi, bắt buộc): ID đỉnh kết thúc
- `thickness` (số, bắt buộc): Độ dày tường tính bằng mm (thông thường: 150-300)
- `isOuter` (boolean, bắt buộc): True cho tường ngoài, false cho tường trong

## 3. Rooms (Phòng)

Đa giác được định nghĩa bởi mảng đỉnh có thứ tự.

```json
"rooms": {
  "r1": {
    "name": "Phòng khách",
    "vertices": ["v1", "v2", "v3", "v4"],
    "type": "living",
    "area": 12000000
  }
}
```

**Các trường:**

- `name` (chuỗi, bắt buộc): Tên hiển thị của phòng
- `vertices` (mảng, bắt buộc): Các ID đỉnh có thứ tự tạo thành đa giác (theo chiều kim đồng hồ hoặc ngược chiều)
- `type` (chuỗi, bắt buộc): Loại phòng - một trong: `"living"`, `"bedroom"`, `"kitchen"`, `"bathroom"`, `"dining"`, `"office"`, `"other"`
- `area` (số, tùy chọn): Diện tích tính sẵn tính bằng mm² (tự động tính nếu bỏ qua)

## 4. Symbols (Ký hiệu)

Các mẫu định nghĩa loại cửa/cửa sổ/nội thất.

### Ký hiệu Cửa

```json
"symbols": {
  "door.single": {
    "type": "anchored",
    "anchor": "wall",
    "geometry": {
      "width": 900,
      "swing": {
        "radius": 800,
        "angle": 90
      }
    },
    "render": {
      "type": "arc+line",
      "stroke": "#8b4513",
      "strokeWidth": 2
    }
  }
}
```

### Ký hiệu Cửa sổ

```json
"window.slider": {
  "type": "anchored",
  "anchor": "wall",
  "geometry": {
    "width": 1200,
    "sillHeight": 900,
    "height": 1200
  },
  "render": {
    "type": "rect",
    "stroke": "#4169e1",
    "strokeWidth": 2,
    "fill": "rgba(65, 105, 225, 0.1)"
  }
}
```

**Các trường Symbol:**

- `type` (chuỗi, bắt buộc): `"anchored"` (gắn vào tường) hoặc `"free"` (đặt tự do)
- `anchor` (chuỗi, bắt buộc nếu anchored): `"wall"` hoặc `"room"`
- `geometry` (object, bắt buộc): Kích thước và thuộc tính
  - `width` (số, bắt buộc): Chiều rộng tính bằng mm
  - `swing` (object, tùy chọn cho cửa): Thông số cung quay
  - `sillHeight` (số, tùy chọn cho cửa sổ): Độ cao từ sàn
  - `height` (số, tùy chọn cho cửa sổ): Chiều cao cửa sổ
- `render` (object, bắt buộc): Hiển thị hình ảnh
  - `type` (chuỗi): `"arc+line"`, `"rect"`, `"polyline"`
  - `stroke` (chuỗi): Mã màu hex
  - `strokeWidth` (số): Độ dày đường kẻ
  - `fill` (chuỗi, tùy chọn): Màu tô với độ trong suốt

## 5. Instances (Thể hiện)

Các đối tượng thực tế được đặt trong mặt bằng.

### Instance gắn tường (Cửa/Cửa sổ)

```json
"instances": {
  "d1": {
    "symbol": "door.single",
    "constraint": {
      "attachTo": {
        "kind": "wall",
        "id": "w1"
      },
      "offsetFromStart": 1500
    },
    "transform": null,
    "props": {
      "width": 900,
      "label": "Cửa chính"
    }
  }
}
```

**Các trường Instance:**

- `symbol` (chuỗi, bắt buộc): Tham chiếu ID symbol
- `constraint` (object, bắt buộc cho anchored): Thông tin gắn kết
  - `attachTo` (object, bắt buộc):
    - `kind` (chuỗi): `"wall"` hoặc `"room"`
    - `id` (chuỗi): ID tường/phòng
  - `offsetFromStart` (số, bắt buộc): Khoảng cách từ điểm đầu tường tính bằng mm
- `transform` (object, bắt buộc cho đặt tự do): Vị trí và góc xoay
  - `position` (mảng): `[x, y]` tính bằng mm
  - `rotation` (số): Độ (0-360)
- `props` (object, tùy chọn): Ghi đè giá trị mặc định của symbol
  - `width` (số, tùy chọn): Chiều rộng tùy chỉnh tính bằng mm
  - `label` (chuỗi, tùy chọn): Nhãn hiển thị

## Ví Dụ Đầy Đủ

```json
{
  "units": "mm",
  "vertices": {
    "v1": { "x": 0, "y": 0 },
    "v2": { "x": 6000, "y": 0 },
    "v3": { "x": 6000, "y": 4000 },
    "v4": { "x": 0, "y": 4000 }
  },
  "walls": {
    "w1": { "vStart": "v1", "vEnd": "v2", "thickness": 200, "isOuter": true },
    "w2": { "vStart": "v2", "vEnd": "v3", "thickness": 200, "isOuter": true },
    "w3": { "vStart": "v3", "vEnd": "v4", "thickness": 200, "isOuter": true },
    "w4": { "vStart": "v4", "vEnd": "v1", "thickness": 200, "isOuter": true }
  },
  "rooms": {
    "r1": {
      "name": "Phòng khách",
      "vertices": ["v1", "v2", "v3", "v4"],
      "type": "living",
      "area": 24000000
    }
  },
  "symbols": {
    "door.single": {
      "type": "anchored",
      "anchor": "wall",
      "geometry": {
        "width": 900,
        "swing": { "radius": 800, "angle": 90 }
      },
      "render": {
        "type": "arc+line",
        "stroke": "#8b4513",
        "strokeWidth": 2
      }
    }
  },
  "instances": {
    "d1": {
      "symbol": "door.single",
      "constraint": {
        "attachTo": { "kind": "wall", "id": "w1" },
        "offsetFromStart": 2500
      },
      "transform": null,
      "props": {
        "width": 900,
        "label": "D-01"
      }
    }
  }
}
```

## Quy Tắc Validation

1. **ID Vertex**: Phải duy nhất, khuyến nghị định dạng `v1`, `v2`, v.v.
2. **ID Wall**: Phải duy nhất, khuyến nghị định dạng `w1`, `w2`, v.v.
3. **Vertices phòng**: Phải tạo thành đa giác khép kín (tối thiểu 3 đỉnh)
4. **Tham chiếu tường**: `vStart` và `vEnd` phải tồn tại trong vertices
5. **Vertices phòng**: Tất cả ID đỉnh phải tồn tại
6. **Instance attachTo**: ID tường/phòng phải tồn tại
7. **Instance offsetFromStart**: Phải nằm giữa 0 và độ dài tường
8. **Instance symbol**: Phải tham chiếu ID symbol tồn tại

## Kích Thước Thông Dụng (mm)

### Tường

- Tường ngoài: 200-300mm
- Tường trong: 100-150mm

### Cửa

- Cửa đơn tiêu chuẩn: 800-900mm
- Cửa đôi: 1200-1600mm
- Bán kính quay: thường bằng chiều rộng - 100mm

### Cửa sổ

- Cửa sổ nhỏ: 600-900mm
- Cửa sổ tiêu chuẩn: 1200-1500mm
- Cửa sổ lớn: 1800-2400mm
- Độ cao ngưỡng: 900-1200mm

### Loại Phòng

- `living`: Phòng khách, phòng tiếp
- `bedroom`: Phòng ngủ
- `kitchen`: Nhà bếp, khu vực nấu ăn
- `bathroom`: Phòng tắm, nhà vệ sinh
- `dining`: Phòng ăn
- `office`: Văn phòng, phòng làm việc
- `other`: Hành lang, kho, v.v.

## Lưu Ý

- Hệ tọa độ: Gốc ở góc trên-trái, X tăng sang phải, Y tăng xuống dưới
- Tất cả góc tính bằng độ (0-360), ngược chiều kim đồng hồ từ trục X dương
- Diện tích phòng tự động tính bằng công thức Shoelace nếu bỏ qua
- Instance `offsetFromStart` được đo dọc theo tường từ `vStart` đến `vEnd`
- Định dạng màu: Hex `"#RRGGBB"` hoặc RGBA `"rgba(R, G, B, A)"`
