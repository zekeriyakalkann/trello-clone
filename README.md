# Trello Clone / Kanban Board Projesi

Modern arayüz tasarımına sahip, sürükle-bırak destekli gelişmiş bir Kanban / Trello Clone uygulamasıdır.  
Bu proje saf HTML, CSS ve Vanilla JavaScript kullanılarak geliştirilmiştir.

---

# Proje Hakkında

Bu uygulama kullanıcıların görevlerini kolonlar halinde yönetebilmesini sağlayan modern bir görev takip sistemidir.

Kullanıcılar:

- Kolon oluşturabilir
- Kart ekleyebilir
- Kartları sürükleyip taşıyabilir
- Kullanıcı atayabilir
- Checklist oluşturabilir
- PDF / JSON çıktısı alabilir
- Verileri içe aktarabilir
- Dark Mode kullanabilir

---

# Kullanılan Teknolojiler

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage API
- jsPDF Library

---

# Proje Yapısı

```bash
trello-clone/
│
├── Trello Clon Diagrams/
│   └── UML ve sistem diyagramları
│
├── trello-clon/
│   └── kanban-project/
│       ├── index.html
│       ├── css/
│       ├── js/
│       └── assets/
│
├── Trello Clon Report.docx
└── README.md
```

---

# Özellikler

## Görev Yönetimi
- Dinamik kolon oluşturma
- Kart ekleme / silme
- Kart detay düzenleme
- Açıklama alanı

## Drag & Drop Sistemi
- Kart sürükle-bırak
- Kolon sürükle-bırak
- Mobil touch desteği

## Kullanıcı Sistemi
- Kullanıcı ekleme
- Kartlara kullanıcı atama
- Avatar sistemi

## Checklist Sistemi
- Kart içi görev listesi
- Tamamlanma yüzdesi
- Progress bar desteği

## Tema Sistemi
- Dark Mode
- Light Mode

## Veri Yönetimi
- LocalStorage kayıt sistemi
- JSON içe aktarma
- JSON dışa aktarma
- PDF export desteği

## Ek Özellikler
- Klavye kısayolları
- Arama sistemi
- Etiket filtreleme
- Aktivite geçmişi

---

# Çalıştırma Adımları

## 1. Projeyi İndir

Repository’i klonlayın veya ZIP olarak indirin.

---

## 2. Proje Klasörüne Girin

```bash
trello-clon/kanban-project
```

---

## 3. index.html Dosyasını Açın

```bash
index.html
```

dosyasını herhangi bir tarayıcı ile çalıştırın.

Önerilen tarayıcılar:

- Google Chrome
- Microsoft Edge
- Firefox

---

# Sistem Mimarisi

Proje modüler JavaScript mimarisi kullanılarak geliştirilmiştir.

## app.js
Ana uygulama mantığını yönetir.

## ui.js
Arayüz işlemlerini ve DOM yönetimini gerçekleştirir.

## drag.js
Desktop drag & drop işlemlerini yönetir.

## touch.js
Mobil cihaz touch drag sistemi sağlar.

## keyboard.js
Klavye kısayollarını yönetir.

## storage.js
LocalStorage veri yönetimini sağlar.

---

# Kullanılan Veri Yapısı

Projede veriler JSON formatında saklanmaktadır.

Örnek veri yapısı:

```json
{
  "id": "card-1",
  "title": "Görev Başlığı",
  "description": "Görev açıklaması",
  "label": "red",
  "assignee": "user-1",
  "dueDate": "2026-05-15"
}
```

---

# Diyagramlar

Proje içerisinde:

```bash
Trello Clon Diagrams/
```

klasörü altında sistem diyagramları ve UML yapıları bulunmaktadır.

---

# Rapor

Detaylı proje raporu:

```bash
Trello Clon Report.docx
```

dosyası içerisinde yer almaktadır.

---

# Amaç

Bu proje:

- Modern frontend mimarisi öğrenmek
- DOM yönetimi geliştirmek
- Drag & Drop sistemlerini anlamak
- Modüler JavaScript mimarisi kurmak
- Kullanıcı deneyimi geliştirmek

amacıyla geliştirilmiştir.

---

# Geliştirici

Zekeriya Kalkan

GitHub:
https://github.com/zekeriyakalkann

---

# Lisans

Bu proje eğitim ve geliştirme amaçlı hazırlanmıştır.
