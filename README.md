<div align="center">

# Expenser

**Quản lý chi tiêu cá nhân — tối giản, nhanh, mã nguồn mở.**
<br />
*A fast, open-source personal expense tracker with a modern minimalist interface.*

[![Live demo](https://img.shields.io/badge/Live%20demo-expenser--quan--ly--chi--tieu.vercel.app-008236?style=for-the-badge&logo=vercel&logoColor=white)](https://expenser-quan-ly-chi-tieu.vercel.app/)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

[Dùng thử](https://expenser-quan-ly-chi-tieu.vercel.app/) ·
[Trang giới thiệu](https://expenser-quan-ly-chi-tieu.vercel.app/landing.html) ·
[Cài đặt](#-bắt-đầu) ·
[Thiết kế](#-hệ-thống-thiết-kế)

</div>

---

## Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Ảnh chụp màn hình](#-ảnh-chụp-màn-hình)
- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Bắt đầu](#-bắt-đầu)
- [Scripts](#-scripts)
- [Hệ thống thiết kế](#-hệ-thống-thiết-kế)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Mô hình dữ liệu](#-mô-hình-dữ-liệu)
- [Triển khai](#-triển-khai)
- [Trình duyệt hỗ trợ](#-trình-duyệt-hỗ-trợ)
- [Giấy phép](#-giấy-phép)

## 📖 Giới thiệu

**Expenser** giúp bạn ghi lại thu chi trong vài giây, theo dõi nhiều ví, xem thống kê trực quan và xuất báo cáo (PDF / Excel / ảnh). Ứng dụng ưu tiên thao tác một tay trên điện thoại, cài được như ứng dụng thật (PWA) và vẫn dùng được khi mất mạng.

| | |
| --- | --- |
| 🎨 **Giao diện tối giản** | Nền phẳng, viền mảnh, ít đổ bóng; chế độ sáng / tối / theo hệ thống và màu nhấn tùy chọn. |
| ⚡ **Nhập liệu nhanh** | Gợi ý số tiền một chạm (gõ `2` → `2.000 · 20.000 · 200.000 · 2.000.000`) và nhập lại các mục gần đây. |
| 🌐 **Song ngữ** | Tiếng Việt / English, ngày giờ và tiền tệ tự định dạng theo ngôn ngữ. |
| 📴 **Offline-first** | PWA có splash screen theo giao diện sáng/tối, Firestore lưu đệm và tự đồng bộ khi có mạng. |
| 🔓 **Mã nguồn mở** | Phát hành theo giấy phép MIT. |

## 🖼️ Ảnh chụp màn hình

<!-- Thay các ảnh trong thư mục screenshots/ bằng ảnh chụp giao diện hiện tại, giữ nguyên tên file. -->

| | | |
| :---: | :---: | :---: |
| ![Tổng quan](screenshots/image01.png)<br/>**Tổng quan** | ![Giao dịch](screenshots/image02.png)<br/>**Danh sách giao dịch** | ![Thêm giao dịch](screenshots/image03.png)<br/>**Thêm giao dịch** |
| ![Thống kê](screenshots/image04.png)<br/>**Thống kê** | ![Báo cáo](screenshots/image05.png)<br/>**Báo cáo PDF có biểu đồ tròn** | ![Màu nhấn](screenshots/image06.png)<br/>**Màu nhấn** |
| ![Chế độ tối](screenshots/image07.png)<br/>**Chế độ tối** | ![Di động](screenshots/image08.png)<br/>**Giao diện di động** | ![English](screenshots/image09.png)<br/>**Tiếng Anh** |
| ![Lịch](screenshots/image10.png)<br/>**Lịch giao dịch** | ![Ngăn kéo ngày](screenshots/image11.png)<br/>**Chi tiết một ngày** | ![Ngăn kéo trên máy tính](screenshots/image13.png)<br/>**Chi tiết ngày trên máy tính** |

## ✨ Tính năng

### Quản lý tài chính

| Tính năng | Mô tả |
| --- | --- |
| **Tổng quan** | Số dư, thu/chi tháng này (so với tháng trước), biểu đồ tròn, cơ cấu chi tiêu, giao dịch gần đây và số dư từng ví. |
| **Giao dịch** | Xem dạng danh sách (nhóm theo ngày) hoặc lịch tháng; lọc, tìm kiếm, sắp xếp; vuốt phải để sửa, vuốt trái để xóa; tự tải thêm khi cuộn. |
| **Nhập nhanh** | **Gợi ý số tiền**: gõ `2` để chọn `2.000`, `20.000`, `200.000` hoặc `2.000.000`; gõ `25` ra `25.000 … 25.000.000`. Ngoài ra có gợi ý các mục đã nhập gần đây (số tiền, danh mục, ví). |
| **Danh mục** | Thêm / sửa / xóa danh mục thu và chi với emoji và màu tùy chỉnh. |
| **Nhiều ví** | Số dư từng ví và chuyển tiền giữa các ví. |

### Thống kê & báo cáo

- Lọc theo **Hôm nay / Tuần này / Tháng này / Năm nay / Tất cả**, điều hướng sang kỳ trước/sau.
- Biểu đồ xu hướng, so sánh thu–chi và biểu đồ tròn theo danh mục.
- Xuất báo cáo **PDF / Excel / ảnh PNG**, tất cả đều có biểu đồ tròn.
- Nhập / xuất **giao dịch** và **danh mục** riêng biệt (CSV, Excel `.xlsx`, JSON) cùng nút **Xuất tất cả**; nhập hàng loạt nhanh nhờ ghi theo lô.

### Trải nghiệm

- Chế độ **Sáng / Tối / Theo hệ thống**, **màu nhấn** (8 màu gợi ý hoặc chọn bất kỳ), cỡ chữ 3 mức.
- Form nhiều trường mở dạng sheet toàn màn hình; form ngắn và hộp xác nhận dùng dialog; không tự focus để tránh bật bàn phím.
- Bộ lọc từng trang và trạng thái các mục Cài đặt được nhớ trong phiên.
- Tìm kiếm nhanh **Ctrl + K**; hoạt ảnh gọn nhẹ, tôn trọng `prefers-reduced-motion`.
- **PWA**: cài lên màn hình chính, dùng offline, splash screen không còn nền trắng và đổi theo giao diện sáng/tối.
- Truy cập tốt: nhãn ARIA, điều hướng bàn phím, bẫy focus trong hộp thoại.

## 🧰 Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7 |
| Giao diện | Tailwind CSS 3, token màu `oklch` trong `expenser-theme.css`, font hệ thống, lucide-react |
| Backend | Firebase Authentication + Cloud Firestore (persistent cache) |
| Biểu đồ | Recharts |
| Xuất / nhập | jsPDF + autoTable, ExcelJS, PapaParse, html2canvas |
| PWA | vite-plugin-pwa (Workbox), ảnh splash iOS sinh lúc build |
| Công cụ | oxlint, script kiểm tra i18n |

## 🚀 Bắt đầu

**Yêu cầu:** Node.js ≥ 18 và một dự án [Firebase](https://console.firebase.google.com/).

```bash
git clone <repo-url>
cd expenser
npm install
```

**1. Tạo Firebase project**

1. Firebase Console → **Add project**.
2. **Authentication → Sign-in method**: bật **Google** (và Email/Password nếu muốn dùng trang `/register`).
3. **Firestore Database → Create database**.
4. **Project settings → Your apps → Web app**: sao chép `firebaseConfig`.

**2. Biến môi trường** — sao chép `.env.example` thành `.env` rồi điền:

```env
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
```

**3. Security Rules** — dán nội dung [`firestore.rules`](firestore.rules) vào tab **Rules** (mỗi người dùng chỉ đọc/ghi dữ liệu của chính mình).

**4. Authorized domains** — *Authentication → Settings → Authorized domains*: thêm `localhost` và tên miền triển khai.

**5. Chạy thử**

```bash
npm run dev
```

## 🛠️ Scripts

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Dev server tại `http://localhost:5173` (thêm `-- --host` để mở trên điện thoại cùng mạng LAN). |
| `npm run build` | Build production vào `dist/` (kèm service worker và ảnh splash). |
| `npm run preview` | Chạy thử bản build. |
| `npm run lint` | Kiểm tra code bằng oxlint. |
| `npm run i18n:check` | Kiểm tra mọi khóa dịch có đủ ở `vi.js` và `en.js`. |

**Thêm / sửa văn bản:** mọi chuỗi hiển thị nằm trong [`src/i18n/vi.js`](src/i18n/vi.js) và [`src/i18n/en.js`](src/i18n/en.js). Dùng `const t = useT()` rồi `t('khóa', { n: 3 })`; trong tiếng Anh, khóa kết thúc `_one` là dạng số ít khi `n === 1`.

## 🎨 Hệ thống thiết kế

Phong cách **modern minimalist**: nền phẳng, viền mảnh thay cho đổ bóng, góc bo nhỏ, màu nhấn xanh lá duy nhất.

**Token màu — một nguồn duy nhất.** Toàn bộ màu nằm trong [`src/theme/expenser-theme.css`](src/theme/expenser-theme.css) (`:root` = sáng, `.dark` = tối, giá trị `oklch`). [`src/index.css`](src/index.css) ánh xạ các token đó sang tên màu mà component và Tailwind dùng (`bg-surface`, `text-on-surface-variant`, `bg-card`, `border-line`, `text-brand`…), nên sửa file theme là cả ứng dụng đổi theo.

| Việc cần làm | Sửa ở đâu |
| --- | --- |
| Đổi bảng màu | Các biến trong `src/theme/expenser-theme.css` |
| Đổi độ bo góc | `--radius` trong `src/theme/expenser-theme.css` |
| Thêm / đổi màu nhấn gợi ý | `ACCENT_PRESETS` trong `src/theme/index.js` |
| Đổi màu splash screen | `SPLASH` trong `src/theme/index.js`, kèm `index.html`, `src/index.css` và `vite.config.js` |

**Màu nhấn.** Mặc định là đúng theme. Khi người dùng chọn màu khác, chỉ `primary`, `chart-*` và `sidebar-primary` bị ghi đè theo hue của màu đó, với độ sáng/độ bão hòa lấy từ dải xanh lá của theme để luôn đủ tương phản ở cả chế độ sáng và tối.

**Splash screen PWA.** Màu nền xanh brand ở giao diện sáng và `#0a0a0a` ở giao diện tối — không bao giờ trắng.

- **iOS**: ảnh `apple-touch-startup-image` sáng/tối cho từng kích thước iPhone/iPad, chọn bằng `prefers-color-scheme`.
- **Android**: Chrome chưa hỗ trợ biến thể tối cho `background_color` của manifest nên dùng một màu cố định (xanh brand); màn hình tải trong trang sau đó hiển thị đúng theme.

## 📂 Cấu trúc dự án

```
expenser/
├── public/
│   ├── landing.html          # Trang giới thiệu (một file HTML, cùng phong cách tối giản)
│   ├── icons/ · favicon.*    # Icon PWA & favicon
│   └── og-image.png · robots.txt · sitemap.xml
├── screenshots/              # Ảnh minh họa cho README
├── scripts/check-i18n.mjs    # Kiểm tra đồng bộ từ điển vi/en
├── src/
│   ├── components/
│   │   ├── layout/           # AppLayout, Sidebar, Topbar, MobileNav, CommandPalette
│   │   ├── ui/               # Button, Modal, MoneyInput, TextInput, SplashScreen…
│   │   └── *.jsx             # Form giao dịch / danh mục / ví, bộ lọc, lịch
│   ├── contexts/             # Auth, Settings (giao diện + ngôn ngữ), Data (Firestore)
│   ├── hooks/                # useSessionState, useLocalStorage, usePwaInstall…
│   ├── i18n/                 # vi.js, en.js, hook useT
│   ├── pages/                # Dashboard, Transactions, Categories, Wallets, Statistics, Settings…
│   ├── routes/               # ProtectedRoute, PublicRoute, ProtectedShell
│   ├── theme/                # expenser-theme.css (token) + màu nhấn, splash
│   ├── utils/                # format, validators, exportImport, pieChart…
│   ├── firebase.js · firestore.js
│   └── main.jsx · App.jsx · index.css
└── firestore.rules · vercel.json · vite.config.js · tailwind.config.js
```

## 🗄️ Mô hình dữ liệu

```
users/{uid}
  ├── transactions/{id}  { type, amount, categoryId, walletId, date, note }
  ├── categories/{id}    { name, type, emoji, color }
  └── wallets/{id}       { name, icon, color, balance }
```

## 📦 Triển khai

```bash
npm run build
```

Triển khai thư mục `dist/` lên **Vercel** (đã có `vercel.json`: SPA rewrite và cache header), Firebase Hosting hoặc Netlify. Nhớ thêm tên miền triển khai vào **Authorized domains** của Firebase Auth. Trang giới thiệu tĩnh được phục vụ tại `/landing.html`.

## 🌍 Trình duyệt hỗ trợ

Giao diện dùng `oklch()` và `color-mix()`, yêu cầu trình duyệt hiện đại: **Chrome / Edge 111+**, **Safari 16.4+**, **Firefox 113+**.

## 📄 Giấy phép

Phát hành theo giấy phép **[MIT](LICENSE)** — bạn có thể tự do sử dụng, sao chép, chỉnh sửa và phân phối, kể cả cho mục đích thương mại, miễn là giữ lại thông báo bản quyền.

---

<div align="center">

**Expenser** được phát triển bởi **minhtrong67** với sự hỗ trợ của AI **Claude** (Anthropic).

⭐ Nếu thấy hữu ích, hãy tặng dự án một ngôi sao nhé!

</div>
