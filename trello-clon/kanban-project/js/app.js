const App = {
    data: [],
    users: [],
    currentView: 'board',

    init: () => {
        App.data = Storage.load();
        App.users = Storage.loadUsers();
        
        UI.init(); 
        UI.renderUsers(App.users); // Önce kullanıcıları çiz (dropdown dolsun)
        UI.renderBoard(App.data, App.users);
        
        const importInput = document.getElementById('import-input');
        importInput.onchange = App.importData;
    },

    // --- USER MANAGEMENT ---
    addUser: (name) => {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
        const colors = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f1c40f", "#1abc9c", "#e67e22"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const newUser = {
            id: 'user-' + Date.now(),
            name: name,
            initials: initials,
            color: randomColor
        };
        App.users.push(newUser);
        Storage.saveUsers(App.users);
        
        // Arayüzü güncelle
        if (window.UI) {
            window.UI.renderUsers(App.users);
            window.UI.showToast("Kullanıcı başarıyla eklendi.", "success");
        }
    },

    deleteUser: (userId) => {
        if(confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) {
            App.users = App.users.filter(u => u.id !== userId);
            Storage.saveUsers(App.users);
            
            // Eğer bir karta atanmışsa temizle (opsiyonel, veya ui.js "Atanmadı" der)
            App.data.forEach(col => {
                col.cards.forEach(card => {
                    if (card.assignee === userId) {
                        card.assignee = '';
                        App.addLogToCard(card, 'Atanan kullanıcı silindi.');
                    }
                });
            });
            Storage.save(App.data);

            if (window.UI) {
                window.UI.renderUsers(App.users);
                window.UI.renderBoard(App.data, App.users);
                window.UI.showToast("Kullanıcı başarıyla silindi.", "info");
            }
        }
    },

    // --- BOARD MANAGEMENT ---
    addLogToCard: (card, actionStr) => {
        if (!card.history) card.history = [];
        card.history.push({
            timestamp: new Date().toISOString(),
            action: actionStr
        });
    },

    findCardInState: (cardId) => {
        for (const col of App.data) {
            const card = col.cards.find(c => c.id === cardId);
            if (card) return card;
        }
        return null;
    },

    addColumn: (title) => {
        App.data.push({ id: 'col-' + Date.now(), title: title, cards: [] });
        App.saveAndRender();
    },

    deleteColumn: (colId) => {
        if(confirm('Kolonu silmek istediğinize emin misiniz?')) {
            App.data = App.data.filter(c => c.id !== colId);
            App.saveAndRender();
            if (window.UI) window.UI.showToast("Kolon silindi.", "info");
        }
    },

    updateColumnTitle: (colId, newTitle) => {
        const col = App.data.find(c => c.id === colId);
        if (col && col.title !== newTitle) {
            col.title = newTitle;
            Storage.save(App.data);
        }
    },

    addCard: (colId, title) => {
        const col = App.data.find(c => c.id === colId);
        if (col) {
            const newCard = { 
                id: 'card-' + Date.now(), 
                title: title, 
                description: '', 
                label: '',
                assignee: '',
                dueDate: '',
                completed: false,
                checklist: [],
                history: []
            };
            App.addLogToCard(newCard, 'Kart oluşturuldu.');
            col.cards.push(newCard);
            App.saveAndRender();
            if (window.UI) window.UI.showToast("Kart başarıyla eklendi.", "success");
        }
    },

    deleteCard: (colId, cardId) => {
        if(confirm('Kartı silmek istediğinize emin misiniz?')) {
            const col = App.data.find(c => c.id === colId);
            if (col) {
                col.cards = col.cards.filter(c => c.id !== cardId);
                App.saveAndRender();
                if (window.UI) window.UI.showToast("Kart başarıyla silindi.", "info");
            }
        }
    },

    updateCardDetails: (colId, cardId, title, description, label, assignee, dueDate, completed) => {
        const col = App.data.find(c => c.id === colId);
        if (col) {
            const card = col.cards.find(c => c.id === cardId);
            if (card) {
                let changes = [];
                if (card.title !== title) changes.push('başlık');
                if (card.description !== description) changes.push('açıklama');
                if (card.label !== label) changes.push('etiket');
                if (card.assignee !== assignee) {
                    const u = App.users.find(x => x.id === assignee);
                    changes.push(`atanan kişi (${u ? u.name : 'Yok'})`);
                }
                if (card.dueDate !== dueDate) changes.push('tarih');
                if (card.completed !== completed) changes.push(completed ? 'tamamlandı' : 'tamamlanmadı');

                card.title = title;
                card.description = description;
                card.label = label;
                card.assignee = assignee;
                card.dueDate = dueDate;
                card.completed = completed;

                if (changes.length > 0) {
                    App.addLogToCard(card, `Kart güncellendi (${changes.join(', ')}).`);
                }

                App.saveAndRender();
                if (window.UI) window.UI.showToast("Değişiklikler kaydedildi.", "success");
            }
        }
    },

    // --- CHECKLIST FONKSİYONLARI ---
    addChecklistItem: (colId, cardId, text) => {
        const card = App.findCardInState(cardId);
        if (card) {
            if (!card.checklist) card.checklist = [];
            card.checklist.push({ id: 'chk-' + Date.now(), text: text, done: false });
            App.addLogToCard(card, `Checklist eklendi: "${text}"`);
            Storage.save(App.data);
            requestAnimationFrame(() => {
                UI.renderChecklist(card.checklist);
                UI.renderHistory(card.history);
                UI.renderBoard(App.data, App.users);
            });
        }
    },

    toggleChecklistItem: (colId, cardId, chkId, isDone) => {
        const card = App.findCardInState(cardId);
        if (card && card.checklist) {
            const item = card.checklist.find(c => c.id === chkId);
            if (item) {
                item.done = isDone;
                const status = isDone ? 'tamamlandı' : 'tamamlanmadı';
                App.addLogToCard(card, `Checklist "${item.text}" ${status} olarak işaretlendi.`);
                Storage.save(App.data);
                requestAnimationFrame(() => {
                    UI.renderChecklist(card.checklist);
                    UI.renderHistory(card.history);
                    UI.renderBoard(App.data, App.users);
                });
            }
        }
    },

    deleteChecklistItem: (colId, cardId, chkId) => {
        const card = App.findCardInState(cardId);
        if (card && card.checklist) {
            const itemIndex = card.checklist.findIndex(c => c.id === chkId);
            if (itemIndex > -1) {
                const text = card.checklist[itemIndex].text;
                card.checklist.splice(itemIndex, 1);
                App.addLogToCard(card, `Checklist silindi: "${text}"`);
                Storage.save(App.data);
                requestAnimationFrame(() => {
                    UI.renderChecklist(card.checklist);
                    UI.renderHistory(card.history);
                    UI.renderBoard(App.data, App.users);
                });
            }
        }
    },

    saveAndRender: () => {
        Storage.save(App.data);
        requestAnimationFrame(() => {
            UI.renderBoard(App.data, App.users);
        });
    },

    updateStateFromDOM: () => {
        const newData = [];
        document.querySelectorAll('.column:not(.column-placeholder)').forEach(colEl => {
            const colId = colEl.dataset.id;
            const oldCol = App.data.find(c => c.id === colId);
            const colTitle = oldCol ? oldCol.title : 'Yeni Kolon';
            
            const cards = [];
            colEl.querySelectorAll('.card:not(.drag-placeholder)').forEach(cardEl => {
                const cardId = cardEl.dataset.id;
                const oldCard = App.findCardInState(cardId);
                if (oldCard) cards.push(oldCard);
            });
            
            newData.push({ id: colId, title: colTitle, cards });
        });
        
        App.data = newData;
        Storage.save(App.data);
        if (window.UI) window.UI.updateCardCounts();
    },

    findCardInState: (cardId) => {
        for (let col of App.data) {
            const card = col.cards.find(c => c.id === cardId);
            if (card) return card;
        }
        return null;
    },

    exportData: () => {
        const exportObj = {
            board: App.data,
            users: App.users
        };
        const dataStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanban-export-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    exportAsPDF: () => {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            if (window.UI) UI.showToast('jsPDF yuklenemedi!', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;

        // ─────────────────────────────────────────────────────────────────
        // TURKCE KARAKTER DONUSTURUCU
        // jsPDF yerlesik fontlari (Helvetica) UTF-8 desteklemez.
        // Turkce ozel karakterleri Latin karsiliklarina ceviriyoruz.
        // ─────────────────────────────────────────────────────────────────
        const tr = (str) => {
            if (str == null) return '';
            return String(str)
                .replace(/\u0130/g, 'I')  // İ
                .replace(/\u0131/g, 'i')  // ı
                .replace(/\u011e/g, 'G')  // Ğ
                .replace(/\u011f/g, 'g')  // ğ
                .replace(/\u015e/g, 'S')  // Ş
                .replace(/\u015f/g, 's')  // ş
                .replace(/\u00d6/g, 'O')  // Ö
                .replace(/\u00f6/g, 'o')  // ö
                .replace(/\u00dc/g, 'U')  // Ü
                .replace(/\u00fc/g, 'u')  // ü
                .replace(/\u00c7/g, 'C')  // Ç
                .replace(/\u00e7/g, 'c')  // ç
                // Emoji ve ozel unicode kaldirilir
                .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
                .replace(/[\u2600-\u27BF]/g, '')
                .trim();
        };

        // ─────────────────────────────────────────────────────────────────
        // SABITLERI VE YARDIMCI FONKSIYONLAR
        // ─────────────────────────────────────────────────────────────────
        const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW  = doc.internal.pageSize.getWidth();
        const pageH  = doc.internal.pageSize.getHeight();
        const ML     = 14;   // sol margin
        const MR     = 14;   // sag margin
        const cW     = pageW - ML - MR;
        const FOOTER = 10;   // footer icin alt bosluk
        const today  = new Date();
        const dateStr = today.toLocaleDateString('tr-TR');

        let y = ML;

        // Etiket tanimlari (renk + metin)
        const LABEL_MAP = {
            red:    { color: [220, 53, 69],   name: 'Acil'        },
            orange: { color: [253, 126, 20],  name: 'Oncelikli'   },
            green:  { color: [40, 167, 69],   name: 'Tamamlandi'  },
            blue:   { color: [13, 110, 253],  name: 'Bilgi'       },
        };

        // Sayfa tasması kontrolü + yeni sayfa
        const guard = (needed = 10) => {
            if (y + needed > pageH - FOOTER - 5) {
                doc.addPage();
                y = ML;
            }
        };

        // Metin satırı ekle (word-wrap destekli)
        const line = (text, x, fontSize = 10, color = [0, 0, 0], fontStyle = 'normal') => {
            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            doc.setTextColor(...color);
            const chunks = doc.splitTextToSize(tr(text), cW - (x - ML));
            chunks.forEach(chunk => {
                guard(6);
                doc.text(chunk, x, y);
                y += 5.5;
            });
            doc.setTextColor(0, 0, 0);
        };

        // Yatay cizgi
        const hline = (lx = ML, rx = pageW - MR, clr = [220, 220, 220], thickness = 0.2) => {
            doc.setDrawColor(...clr);
            doc.setLineWidth(thickness);
            doc.line(lx, y, rx, y);
        };

        // ─────────────────────────────────────────────────────────────────
        // KAPAK / BASLIK BANDI
        // ─────────────────────────────────────────────────────────────────
        doc.setFillColor(30, 64, 175);   // koyu mavi
        doc.rect(0, 0, pageW, 32, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text('KANBAN BOARD RAPORU', ML, 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Tarih: ' + dateStr, ML, 23);

        // Ozet (sag tarafa)
        const totalCards = App.data.reduce((s, c) => s + c.cards.length, 0);
        doc.text(
            'Toplam: ' + App.data.length + ' kolon | ' + totalCards + ' kart',
            pageW - MR, 23, { align: 'right' }
        );

        doc.setTextColor(0, 0, 0);
        y = 40;

        // Alt cizgi
        hline(ML, pageW - MR, [180, 200, 240], 0.5);
        y += 7;

        // ─────────────────────────────────────────────────────────────────
        // KOLONLAR
        // ─────────────────────────────────────────────────────────────────
        App.data.forEach((col, colIdx) => {
            guard(20);

            // Kolon baslik bandi
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(ML, y - 5, cW, 11, 2, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text(tr(col.title).toUpperCase() + '  (' + col.cards.length + ' kart)', ML + 3, y + 2);
            doc.setTextColor(0, 0, 0);
            y += 13;

            // Bos kolon
            if (col.cards.length === 0) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor(160, 160, 160);
                doc.text('   (Kart bulunamadi)', ML + 4, y);
                doc.setTextColor(0, 0, 0);
                y += 10;
                return;
            }

            // ── KARTLAR ──
            col.cards.forEach((card, cardIdx) => {
                const isCompleted = card.completed === true;
                const dueDate     = card.dueDate ? new Date(card.dueDate) : null;
                const isOverdue   = dueDate && !isCompleted && dueDate < today;

                guard(24);

                // Kart arka plan kutusu (yuksekligi sonradan bilinmiyor,
                // bu yuzden hafif bir sol kenarlık ile ayirt ediyoruz)
                const cardTopY = y - 2;

                // Sol renkli kenar cubugu
                const accentColor = isCompleted
                    ? [40, 167, 69]
                    : (LABEL_MAP[card.label] ? LABEL_MAP[card.label].color : [100, 116, 139]);
                doc.setFillColor(...accentColor);
                doc.rect(ML, cardTopY, 2.5, 1, 'F'); // gecici; gercek yukseklik sonra cizilir

                const cardX = ML + 6; // girintili icerik

                // ── Kart basligi
                const prefix = isCompleted ? '[TAMAMLANDI] ' : '';
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                const titleColor = isCompleted ? [34, 139, 34] : [15, 23, 42];
                doc.setTextColor(...titleColor);
                const titleLines = doc.splitTextToSize(tr(prefix + card.title), cW - 10);
                titleLines.forEach(tl => {
                    guard(7);
                    doc.text(tl, cardX, y);
                    y += 6;
                });
                doc.setTextColor(0, 0, 0);

                // ── Etiket badge
                if (card.label && LABEL_MAP[card.label]) {
                    const lbl = LABEL_MAP[card.label];
                    guard(8);
                    doc.setFillColor(...lbl.color);
                    doc.roundedRect(cardX, y - 1, 28, 5.5, 1.5, 1.5, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(255, 255, 255);
                    doc.text(lbl.name, cardX + 2, y + 3);
                    doc.setTextColor(0, 0, 0);
                    y += 8;
                }

                // ── Gecikme etiketi
                if (isOverdue) {
                    guard(8);
                    doc.setFillColor(220, 53, 69);
                    doc.roundedRect(cardX, y - 1, 22, 5.5, 1.5, 1.5, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(255, 255, 255);
                    doc.text('GECIKMIS', cardX + 1.5, y + 3);
                    doc.setTextColor(0, 0, 0);
                    y += 8;
                }

                // ── Meta bilgiler
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);

                // Atanan
                if (card.assignee) {
                    const user = App.users.find(u => u.id === card.assignee);
                    if (user) {
                        guard(6);
                        doc.setTextColor(60, 60, 60);
                        doc.text('Atanan: ' + tr(user.name), cardX, y);
                        y += 5.5;
                    }
                }

                // Son tarih
                if (dueDate) {
                    guard(6);
                    const dtStr = dueDate.toLocaleDateString('tr-TR');
                    if (isOverdue) doc.setTextColor(220, 53, 69);
                    else           doc.setTextColor(60, 60, 60);
                    doc.text('Son Tarih: ' + dtStr + (isOverdue ? '  (Gecikti)' : ''), cardX, y);
                    y += 5.5;
                }

                doc.setTextColor(0, 0, 0);

                // ── Checklist
                if (card.checklist && card.checklist.length > 0) {
                    const done  = card.checklist.filter(c => c.done).length;
                    const total = card.checklist.length;

                    guard(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(50, 50, 50);
                    doc.text('Checklist: ' + done + '/' + total, cardX, y);
                    y += 5.5;

                    // Progress bar (grafik)
                    const barW = 60;
                    const barH = 3;
                    guard(6);
                    doc.setFillColor(220, 220, 220);
                    doc.roundedRect(cardX, y - 1, barW, barH, 1, 1, 'F');
                    if (done > 0) {
                        doc.setFillColor(40, 167, 69);
                        doc.roundedRect(cardX, y - 1, barW * (done / total), barH, 1, 1, 'F');
                    }
                    y += 6;

                    // Madde listesi
                    card.checklist.forEach(item => {
                        guard(6);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(8.5);
                        const mark = item.done ? '[x]' : '[ ]';
                        const itemColor = item.done ? [34, 139, 34] : [80, 80, 80];
                        doc.setTextColor(...itemColor);
                        const itemLines = doc.splitTextToSize(
                            mark + ' ' + tr(item.text),
                            cW - 16
                        );
                        itemLines.forEach(il => {
                            guard(5.5);
                            doc.text(il, cardX + 3, y);
                            y += 5;
                        });
                    });
                    doc.setTextColor(0, 0, 0);
                    y += 2;
                }

                // Gercek sol kenarligi ciz (simdi yuksekligi biliyoruz)
                doc.setFillColor(...accentColor);
                doc.rect(ML, cardTopY, 2.5, y - cardTopY + 1, 'F');

                // Kart alt ayraç cizgisi
                guard(4);
                hline(ML + 3, pageW - MR - 3, [220, 220, 220], 0.15);
                y += 6;
            });

            y += 5; // Kolonlar arasi bosluk
        });

        // ─────────────────────────────────────────────────────────────────
        // FOOTER (her sayfaya)
        // ─────────────────────────────────────────────────────────────────
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(160, 160, 160);
            // Sol
            doc.text('Kanban Board Raporu  |  ' + dateStr, ML, pageH - 5);
            // Sag
            doc.text('Sayfa ' + i + ' / ' + pageCount, pageW - MR, pageH - 5, { align: 'right' });
            // Ust cizgi
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(ML, pageH - 10, pageW - MR, pageH - 10);
        }

        // ─────────────────────────────────────────────────────────────────
        // INDIR
        // ─────────────────────────────────────────────────────────────────
        const fileName = 'kanban-rapor-' + new Date().toISOString().slice(0, 10) + '.pdf';
        doc.save(fileName);
        if (window.UI) UI.showToast('PDF olusturuldu: ' + fileName, 'success');
    },

    importData: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Eski export formatına da uyum sağla (sadece board dizisiyse)
                if (Array.isArray(json)) {
                    App.data = json;
                } else if (json.board && Array.isArray(json.board)) {
                    App.data = json.board;
                    if (json.users && Array.isArray(json.users)) {
                        App.users = json.users;
                        Storage.saveUsers(App.users);
                    }
                } else {
            if (window.UI) UI.showToast("Geçersiz JSON formatı!", "error");
            return;
        }
        
        App.saveAndRender();
        UI.renderUsers(App.users);
        if (window.UI) UI.showToast("Veriler başarıyla içe aktarıldı!", "success");
    } catch (err) {
        if (window.UI) UI.showToast("Dosya okunamadı veya format hatalı: " + err.message, "error");
    }
};
        reader.readAsText(file);
        e.target.value = '';
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', App.init);
