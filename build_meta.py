# 各ページの <head> に、検索・SNS向けの情報を書き込むスクリプト
#   ・ページの説明文（meta description）
#   ・正式なURL（canonical）
#   ・LINE・SNSで共有したときの表示（OGP）と、その画像（images/og/*.jpg を作る）
#   ・タブのアイコン（favicon.svg・images/apple-touch-icon.png）
#   ・学校情報とオープンキャンパスの日程（構造化データ。トップとオープンキャンパスのページ）
#   ・サイトの地図（sitemap.xml）
# 本体のHTMLを直したら：  py build_meta.py  →  py build_color.py  の順に実行する
# 公開先のURLが変わったら BASE を書き換える
import glob, io, json, os, re
from PIL import Image, ImageDraw, ImageFont

BASE = 'https://uchiikeyu.github.io/cid-renewal-mihon/'
SITE = 'CID 中央情報大学校'
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)
SPEC = ['#4A5CF0', '#00A0E9', '#22A33A', '#8040C0', '#F05A28', '#FF4C7D', '#F08C1E', '#1A9A8A', '#F2B705']
FONT_B = 'C:/Windows/Fonts/YuGothB.ttc'

# ページごと：(共有したときの題名, 説明文, 画像の大きな文字, 画像の小さな文字, 写真, 学科の色)
DEPT = {
    'ict-design': ('高度ICTデザイン学科', '4年制', '高度情報化社会をリードする、スペシャリストへ。', '10の専攻の学生が企業と連携し、AI・XR・ロボット・ドローンなどの研究テーマに取り組む4年制の学科。卒業すると大学卒業と同等の「高度専門士」が与えられます。', 'img06b.jpg', '#4A5CF0'),
    'information-system': ('情報システム学科', '2年制', '未来のITを動かす力は、ここから手に入る。', 'AI・ネットワーク・デジタルテクノロジーを実習中心で学ぶ2年制の学科。2025年度は在校生115名が基本情報技術者試験に合格しました。', 'image_02_c.jpg', '#00A0E9'),
    'agri-foodtech': ('アグリ・フードテック学科', '2年制・2026年新設', '食と農を、テクノロジーで発展させる。', 'ドローンやICTを使ったスマート農業、食の品質管理、商品の企画から販売までを学ぶ、2026年新設の2年制の学科です。', '1_image_02_b.jpg', '#22A33A'),
    'game-creator': ('ゲームクリエイター学科', '3年制・2026年新設', '君のアイディアを、現実のゲームに。', 'プログラミング・デザイン・シナリオを基礎から学び、AI・VR・メタバースも使ってゲームをつくる3年制の学科。自分で企画したゲームをSteamで配信するところまで実践します。', '2_image_02_a.jpg', '#8040C0'),
    'creative-design': ('クリエイティブデザイン学科', '2年制', '世界に通じる技術で、未来をツクるクリエイターに。', 'グラフィック・Web・プロダクト・3D-CADを学ぶ2年制の学科。企業とのデザインプロジェクトで、学生のアイデアが商品化されることもあります。', '3_image_02_b.jpg', '#F05A28'),
    'pop-culture': ('ポップカルチャー学科', '2年制', '好きだから夢中になれる。人をひきつけるコンテンツをつくろう。', 'アニメ・3DCG・マンガ・イラストを、デッサンなどの基礎から学ぶ2年制の学科。いろいろな依頼に応えられるクリエイターを目指します。', '4_image_02_b.jpg', '#FF4C7D'),
    'internet-video-creator': ('ネット動画クリエイター学科', '2年制', '想像力と発信力で、地域と世界をつなぐ。', '動画制作と、配信・Webマーケティングを一緒に学ぶ2年制の学科。誰に向けて、どんな動画を、いつどこで発信するかまで考えられるクリエイターを育てます。', '5_image_02_b.jpg', '#F08C1E'),
    'space-tech-engineer': ('スペーステックエンジニア学科', '2年制・2028年新設', '宇宙開発の未来を支える、次世代エンジニアへ。', '2028年4月新設の2年制の学科。宇宙産業に必要な製造・設計（CAD）・AI・データ活用・組み込みプログラミングを学ぶ、宇宙プロダクト専攻と宇宙データ専攻があります。', 'space_people.jpg', '#F2B705'),
    'electro-communications': ('電気通信学科', '1・2年制', '就職に直結する国家資格と、確かな技術を。', '電気工事士・電気主任技術者などの国家資格を目指す1・2年制の学科。2025年度の第二種電気工事士の合格率は100%（全国平均43.5%）でした。', '6_image_02_c.jpg', '#1A9A8A'),
}
PAGES = {
    'index.html': ('CID 中央情報大学校｜群馬・高崎の情報・デザイン・電気通信の専門学校', '高崎駅東口から徒歩3分。情報・デザイン・電気通信を学ぶ9つの学科がある専門学校です（2028年4月にスペーステックエンジニア学科を新設）。30秒で学科をのぞけるミニ体験、カメラ体験、オープンキャンパスの予約はこちら。', '未来をツクル|人になる。', '情報・デザイン・電気通信の専門学校', 'top_image01f_sp.jpg'),
    'departments.html': ('自分に合う学科を探す', 'CIDの9つの学科を、5つの質問で探せます。学科ごとの年数・学べること・目指せる仕事を比べられます。', '自分に合う学科を探す', '5つの質問で、9つの学科から', 'image_02_a.jpg'),
    'learning.html': ('学びのしくみ', 'CIDの授業は3限目からが科目選択制。将来の目標に合わせて科目を選び、自分だけの時間割を組めます。空いた時間はインターンシップにも使えます。', '時間割を、自分で組む学校。', '3限目からの時間割を組んでみよう', 'img_features3.jpg'),
    'campus-life.html': ('キャンパスライフ', '学園祭、スポーツフェスティバル、TOKYO GAME SHOW出展、CID EXPO。CIDの1年間を月ごとにめくって見られます。', '授業だけじゃない、1年間。', '1年を月ごとにめくる', 'img_jul.jpg'),
    'career.html': ('就職・資格', '1年次の10月から、担任と就職指導センターが一人ひとりの就職活動を支えます。なりたい仕事から、学ぶ学科と主な就職先を逆算できます。', 'なりたい仕事から、逆算する。', '就職支援と主な就職先', 'img_features4.jpg'),
    'works.html': ('作品・産学官連携', '企業や地域、市町村と組んだシステム開発、デザイン提案、新商品の開発。CIDの学生が実際につくったものを紹介します。', '先輩が、本当につくったもの。', '作品と産学官連携', 'img233.jpg'),
    'admission.html': ('学費・サポート・入試', '学科と年数を選ぶと、卒業までの学費が分かります。通学定期の2割補助、一人暮らしの家賃支援（年12万円）、国の修学支援制度もあわせて確かめられます。', 'お金のこと、先に計算しておこう。', '学費・通学の補助・入試', 'img_about1.jpg'),
    'access.html': ('アクセス', '中央情報大学校は高崎駅東口から徒歩3分。〒370-0841 群馬県高崎市栄町13-2。電車の路線と、学校のまわりの施設を紹介します。', '高崎駅東口から、徒歩3分。', '群馬県高崎市栄町13-2', 'img2.jpg'),
    'open-campus.html': ('オープンキャンパス', 'CIDのオープンキャンパスは、どの回も10:00〜12:30（受付9:00〜）。体験授業と、先生や在校生への個別相談があります。日程を選んで予約できます。', '体験の続きは、|学校で。', 'オープンキャンパス　10:00〜12:30', 'img_opencampus.jpg'),
    'camera.html': ('カメラ体験', 'カメラの前に立つと、体の動きをその場で読み取って操作できる5つの体験。映像は保存も送信もせず、端末の中だけで処理します。', '体ごと、操作する。', 'カメラで遊ぶ5つの体験', 'img_jan.jpg'),
    'news.html': ('お知らせ', 'イベント、オープンキャンパス、学科の話題、進路の豆知識など、中央情報大学校からのお知らせです。', 'お知らせ', 'イベント・オープンキャンパス・学科の話題', 'img_may.jpg'),
    'instructor.html': ('講師紹介', '多彩な経歴の講師が、基礎から丁寧に教えます。業界が求める技術と、社会から愛される人間力の両方を育てます。', '本物の技術と、人間力。', '講師紹介', 'img06a.jpg'),
    'about.html': ('学校概要・情報公開', '中央情報大学校の学校概要と情報公開。情報・デザイン・電気通信の分野で、未来のテクノロジー社会に貢献する人を育てます。', '学校概要・情報公開', '学校法人 有坂中央学園', 'img_features1.jpg'),
    'working-adult.html': ('社会人の方へ', '働いた経験のある方の学び直しを、国の教育訓練給付金の制度で支えられます。社会人の入学について紹介します。', '社会人から、学び直す。', '社会人の学び直し', 'img_course2.jpg'),
    'graduate.html': ('卒業生の方へ', '卒業証明書・成績証明書など、各種証明書の発行のご案内です。', '卒業生の方へ', '各種証明書の発行', 'graduate_a.jpg'),
    'recruiting.html': ('採用担当者の方へ', '企業の採用ご担当者様へ。求人票は郵送・FAX・メール添付で受け付けています。', '企業の採用ご担当者様へ', '求人票の受付', 'Vocational-School-signing-ceremony-6-1.jpg'),
    'recruitment.html': ('職員採用', '中央情報大学校で、ともに学生を育てる職員の募集についてのご案内です。', '職員採用', 'ともに学生を育てる仲間', 'img_features5.jpg'),
    'contact.html': ('資料請求・お問い合わせ', 'パンフレットの請求や、入学・学校生活についての質問はこちらから。電話 027-324-8511（9:00〜17:00、土日祝を除く）。', '資料請求・お問い合わせ', '電話 027-324-8511', 'img_features5.jpg'),
    'international-engineer.html': ('国際エンジニア学科', '留学生向けの2年制の学科。2つの専攻から専門科目を学び、日系企業への就職を目指します。', '国際エンジニア学科', '留学生向け・2年制', 'img_features3.jpg'),
    'international.html': ('外国人留学生キャリア形成促進プログラム', '文部科学省の認定を受けた、外国人留学生のキャリア形成を進めるプログラムの案内です。', '外国人留学生|キャリア形成促進プログラム', '文部科学省認定', 'img_features6.jpg'),
    'japanese.html': ('日本語学科', '留学生向けの1.5年制・2年制の学科。日本の専門学校や大学で学べる日本語の力をつけます。', '日本語学科', '留学生向け・1.5年制・2年制', 'img_features1.jpg'),
    'application.html': ('留学生対象入試', '国際エンジニア学科の留学生対象入試の案内です。', '留学生対象入試', '国際エンジニア学科', 'img_features6.jpg'),
}
for slug, (name, yrs, catch, desc, photo, color) in DEPT.items():
    PAGES[slug + '.html'] = (name, desc, name, catch, photo, color)


# ---------- 共有したときの画像（1200×630） ----------
def font(size):
    return ImageFont.truetype(FONT_B, size)

def wrap(draw, text, f, width):
    """日本語を、句読点が行頭に来ないように折り返す"""
    lines, cur = [], ''
    for ch in text:
        if draw.textlength(cur + ch, font=f) > width and cur:
            if ch in '、。，．！？」』）':
                cur += ch; continue
            lines.append(cur); cur = ch
        else:
            cur += ch
    if cur: lines.append(cur)
    return lines

def og_image(name, big, small, photo, color):
    W, H = 1200, 630
    im = Image.open(os.path.join('images/cid', photo)).convert('RGB')
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    im = im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))
    # 左から紺を重ねて、文字を読みやすくする
    ov = Image.new('RGBA', (W, H))
    od = ImageDraw.Draw(ov)
    for x in range(W):
        a = int(240 * max(0, 1 - x / (W * .85)) ** .8) + 40
        od.line([(x, 0), (x, H)], fill=(8, 19, 48, min(255, a)))
    im = Image.alpha_composite(im.convert('RGBA'), ov)
    d = ImageDraw.Draw(im)
    d.text((72, 56), SITE, font=font(30), fill='white')
    if color:
        d.rectangle([72, 108, 72 + 120, 116], fill=color)
    # 大きな文字は、2行以内で、行末に1〜2文字だけ残らない大きさを探す（| は改行の指定）
    def lay(fs):
        f = font(fs); out = []
        for part in big.split('|'):
            out += wrap(d, part, f, 1000)
        return f, out
    for fs in range(88, 50, -4):
        f, lines = lay(fs)
        if len(lines) <= 2 and all(len(l) > 2 for l in lines):
            break
    y = 150 + (2 - len(lines)) * fs * .55
    for ln in lines:
        d.text((72, y), ln, font=f, fill='white'); y += fs * 1.25
    if small:
        sf = font(30)
        for ln in wrap(d, small, sf, 900)[:2]:
            d.text((72, y + 10), ln, font=sf, fill=(220, 230, 250)); y += 44
    # 9学科の色の帯
    for i, c in enumerate(SPEC):
        d.rectangle([i * W / len(SPEC), H - 14, (i + 1) * W / len(SPEC), H], fill=c)
    os.makedirs('images/og', exist_ok=True)
    im.convert('RGB').save(f'images/og/{name}.jpg', quality=84, optimize=True)

# ---------- アイコン ----------
ICON_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M0 0h52l12 12v52H12L0 52z" fill="#DF032E"/><text x="32" y="41" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="22" fill="#fff" text-anchor="middle">CID</text></svg>
'''
io.open('favicon.svg', 'w', encoding='utf-8', newline='\n').write(ICON_SVG)
ic = Image.new('RGB', (180, 180), '#DF032E'); idr = ImageDraw.Draw(ic)
idr.polygon([(146, 0), (180, 0), (180, 34)], fill='#081330'); idr.polygon([(0, 146), (0, 180), (34, 180)], fill='#081330')
f = font(62); w = idr.textlength('CID', font=f); idr.text(((180 - w) / 2, 52), 'CID', font=f, fill='white')
ic.save('images/apple-touch-icon.png')

# ---------- 構造化データ ----------
ADDRESS = {'@type': 'PostalAddress', 'postalCode': '370-0841', 'addressRegion': '群馬県', 'addressLocality': '高崎市', 'streetAddress': '栄町13-2', 'addressCountry': 'JP'}
ORG = {'@context': 'https://schema.org', '@type': 'EducationalOrganization', 'name': '中央情報大学校', 'alternateName': 'CID', 'url': BASE,
       'logo': BASE + 'images/apple-touch-icon.png', 'telephone': '+81-27-324-8511', 'address': ADDRESS,
       'parentOrganization': {'@type': 'Organization', 'name': '学校法人 有坂中央学園'}}
OC_DAYS = [('2026-11-14', 'オープンキャンパス'), ('2026-12-12', 'オープンキャンパス Xmas FEST'), ('2027-01-16', 'オープンキャンパス'),
           ('2027-02-13', 'オープンキャンパス'), ('2027-03-06', 'オープンキャンパス'), ('2027-03-20', 'オープンキャンパス')]
EVENTS = [{'@context': 'https://schema.org', '@type': 'Event', 'name': f'{n}｜中央情報大学校', 'startDate': f'{d}T10:00:00+09:00', 'endDate': f'{d}T12:30:00+09:00',
           'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode', 'eventStatus': 'https://schema.org/EventScheduled',
           'location': {'@type': 'Place', 'name': '中央情報大学校', 'address': ADDRESS},
           'organizer': {'@type': 'EducationalOrganization', 'name': '中央情報大学校', 'url': BASE},
           'description': '体験授業と、先生や在校生への個別相談があります。受付9:00〜。', 'image': BASE + 'images/og/open-campus.jpg',
           'url': BASE + 'open-campus.html'} for d, n in OC_DAYS]

# ---------- 各ページへ書き込む ----------
esc = lambda t: t.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')
urls = []
for f in sorted(glob.glob('*.html')):
    if f not in PAGES:
        print('説明文が未設定:', f); continue
    v = PAGES[f]
    title, desc, big, small, photo = v[:5]
    color = v[5] if len(v) > 5 else None
    name = f[:-5]
    og_image(name, big, small, photo, color)
    url = BASE if f == 'index.html' else BASE + f
    urls.append(url)
    og_title = title if f == 'index.html' else f'{title}｜{SITE}'
    block = [
        '<!-- meta:start（build_meta.py が書き込む。手で直さない） -->',
        f'<meta name="description" content="{esc(desc)}">',
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:type" content="{"website" if f == "index.html" else "article"}">',
        f'<meta property="og:site_name" content="{SITE}">',
        f'<meta property="og:title" content="{esc(og_title)}">',
        f'<meta property="og:description" content="{esc(desc)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{BASE}images/og/{name}.jpg">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:locale" content="ja_JP">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="icon" href="favicon.svg" type="image/svg+xml">',
        '<link rel="apple-touch-icon" href="images/apple-touch-icon.png">',
    ]
    if f == 'index.html':
        block.append('<script type="application/ld+json">' + json.dumps(ORG, ensure_ascii=False) + '</script>')
    if f == 'open-campus.html':
        block.append('<script type="application/ld+json">' + json.dumps(EVENTS, ensure_ascii=False) + '</script>')
    block.append('<!-- meta:end -->')
    s = io.open(f, encoding='utf-8').read()
    s = re.sub(r'\n?<!-- meta:start.*?<!-- meta:end -->', '', s, flags=re.S)
    s = s.replace('</head>', '\n'.join(block) + '\n</head>', 1)
    io.open(f, 'w', encoding='utf-8', newline='\n').write(s)

# ---------- サイトの地図 ----------
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
sm += [f'  <url><loc>{u}</loc></url>' for u in urls]
sm.append('</urlset>')
io.open('sitemap.xml', 'w', encoding='utf-8', newline='\n').write('\n'.join(sm) + '\n')
print(f'{len(urls)} ページに書き込み、images/og/ に共有用の画像を作りました')
