# カラー版（color/ フォルダ）を、本体の29ページから作り直すスクリプト
# 本体（紺・白・赤の版）の HTML を直したら、これを実行して color/ にも反映する：  py build_color.py
# color/ の HTML は毎回上書きされるので、カラー版だけの見た目は color/color.css・color/color.js に書く
import glob, io, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
n = 0
for f in sorted(glob.glob('*.html')):
    s = io.open(f, encoding='utf-8').read()
    ver = (re.search(r'\?v=([0-9a-z]+)', s) or [None, 'x'])[1]
    s = s.replace('<html lang="ja">', '<html lang="ja" data-fx="spectrum">', 1)
    s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script>window.CID_ROOT = \'../\';</script>', 1)
    # 正式なURL・共有用のURLは、カラー版のURLにする（画像は本体のものを共用）
    s = s.replace('<link rel="canonical" href="https://uchiikeyu.github.io/cid-renewal-mihon/', '<link rel="canonical" href="https://uchiikeyu.github.io/cid-renewal-mihon/color/')
    s = s.replace('<meta property="og:url" content="https://uchiikeyu.github.io/cid-renewal-mihon/', '<meta property="og:url" content="https://uchiikeyu.github.io/cid-renewal-mihon/color/')
    s = s.replace('href="favicon.svg"', 'href="../favicon.svg"').replace('href="images/apple-touch-icon.png"', 'href="../images/apple-touch-icon.png"')
    s = s.replace('href="css/', 'href="../css/').replace('src="js/', 'src="../js/').replace('images/cid/', '../images/cid/')
    s = re.sub(r'(<link rel="stylesheet" href="\.\./css/pages\.css[^"]*">)', r'\1\n<link rel="stylesheet" href="color.css?v=' + ver + '">', s, 1)
    s = s.replace('<body ', '<body class="is-color" ', 1)
    s = re.sub(r'<title>(.*?)（作り直し見本）</title>', r'<title>\1（作り直し見本・カラー版）</title>', s, 1)
    s = s.replace('</body>', f'<script src="color.js?v={ver}"></script>\n</body>', 1)
    if f == 'index.html':
        s = s.replace('<svg class="cinema-cover"', '<div class="cinema-tint" id="cinema-tint" aria-hidden="true"></div>\n    <svg class="cinema-cover"', 1)
    io.open(os.path.join('color', f), 'w', encoding='utf-8', newline='\n').write(s)
    n += 1
print(f'color/ に {n} ページを書き出しました')
