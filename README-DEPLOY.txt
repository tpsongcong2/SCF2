Bo deploy moi cho website SCF

Thu muc nay la ban copy rieng, khong ghi de file cu trong G:\My Drive.

Cach dung voi GitHub Pages:
1. Upload toan bo file trong thu muc SCF-deploy-fixed len repository GitHub.
2. Dam bao index.html nam o thu muc duoc GitHub Pages publish.
3. Trong Settings > Pages, chon branch/folder de deploy.
4. Neu deploy o root hoac custom domain, manifest hien tai da dung: start_url "./", scope "./".
5. Neu bat buoc deploy trong duong dan /SCF2/, co the doi lai manifest.json thanh:
   "start_url": "/SCF2/",
   "scope": "/SCF2/"

Tai khoan mac dinh trong ma nguon hien van la admin / 862139.
Neu dua web len cong khai, nen doi mat khau va kiem tra quyen Supabase truoc.
