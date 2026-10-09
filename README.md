# ⚔️ Cyber-Oni Samurai // Next-Gen 3D Gaming Landing Page

<div align="center">

[![Three.js](https://img.shields.io/badge/Three.js-0.186.1-red.svg?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.4-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/ES6_Modules-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![CSS3 3D](https://img.shields.io/badge/CSS3-3D_Transforms-1572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/TR/css-transforms-2/)
[![Web Audio](https://img.shields.io/badge/Web_Audio_API-Synthesizer-00E5FF.svg?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

**Высокотехнологичный интерактивный игровой веб-лендинг в стилистике Cyberpunk / Dark Anime с 3D-трекингом взгляда и спиральной галереей арсенала.**

[🌐 Репозиторий на GitHub](https://github.com/LazizYT/first_project) • [⚡ Демо / Локальный запуск](#-установка-и-быстрый-старт)

</div>

---

## 📸 Галерея и скриншоты проекта

### 1. Главный экран: 3D Кибер-Они Самурай с мистической аурой
> *Интерактивный 3D-самурай в темных матовых доспехах следит за курсором мыши, окутанный пылающей демонической аурой душ и чакра-частиц.*

<div align="center">
  <img src="./docs/images/preview-hero.png" alt="Cyber-Oni Samurai Hero 3D Section" width="950" />
</div>

- **Инверсивный трекинг взгляда**: расчет углов рыскания (Yaw) и тангажа (Pitch) для естественного поворота головы и плечевого пояса за курсором.
- **Мистическая они-аура**: многослойное объемное свечение за спиной воина и вихрь из 280+ восходящих духовных искр и лепестков пламени.
- **Чистый кинематографичный интерфейс**: фокус на персонаже без лишних HUD-панелей телеметрии.
- **Динамический переключатель палитр**: мгновенная смена 4 неоновых стилей (*Crimson Malice*, *Void Cyan*, *Toxic Acid*, *Imperial Gold*) с синхронной перекраской источников света, ауры и материалов.
- **Процедурный аудио-синтезатор**: звуки сервоприводов, плазмы и кликов, генерируемые на лету через `Web Audio API`.

---

### 2. Секция «Arsenal Helix»: Биомеханическое древо Active Theory и клинок
> *Процедурное биомеханическое древо и клинок Мурамаса, окруженные спиральной 3D-орбитой карточек арсенала, скользящих слева-сверху направо-вниз.*

<div align="center">
  <img src="./docs/images/preview-spiral-sword.png" alt="3D Spiral Helix Gallery Around Flaming Sword" width="950" />
</div>

- **Древо в стиле Active Theory**: процедурный позвоночный ствол из позвонков-тороидов, двойная спираль сияющих лент (double-helix ribbons), ветвящаяся крона, корневая система и вихрь из 460+ хроматических спор.
- **Священный клинок в центре**: вертикальный меч с плазменным свечением и вихрем искр, гармонично вращающийся внутри ствола древа.
- **7 арсенальных юнитов в орбите**: 3 зацикленных видео-демонстрации (`.mp4`) и 4 детализированных концепт-арта со стеклянным неоновым эффектом.
- **Плавная физика скролла**: алгоритм с интерполяцией движения (`lerp damping`), амфитеатральным наклоном карточек и динамическим масштабированием.
- **Высокая производительность**: процедурная 3D-геометрия (менее 10к полигонов), отключение скрытых видео и ленивая отрисовка Three.js.

---

### 3. Интерактивная кибер-кузница (The Cyber Forge)
> *Лаборатория синтеза клинков с живым физическим холстом Canvas 2D и частицами высокотемпературной плазмы.*

<div align="center">
  <img src="./docs/images/preview-cyber-forge.png" alt="The Cyber Forge Katana Lab" width="950" />
</div>

- Выбор плазменного ядра (*Crimson Hellfire*, *Cryo Plasma*, *Void Matrix*, *Solar Ember*).
- Выбор металлургии сплава и модификаторов кромки лезвия.
- Интерактивный тест клинка движением курсора с генерацией тепловых искр и расчетом DPS.

---

### 4. Досье оперативников (Choose Your Operative)
> *Интерактивный терминал выбора боевых классов ниндзя синдиката.*

<div align="center">
  <img src="./docs/images/preview-operatives.png" alt="Choose Your Operative Dossier" width="950" />
</div>

- Интерактивные профили бойцов (*Hayabusa*, *Kage*, *Raiden*, *Valkyrie*).
- Анимированные шкалы характеристик (Lethality, Armor Rating, Agility, Cyber-Synapse).
- Карточки уникальных пассивных, тактических и ультимативных способностей.

---

## 🛠 Технологический стек

| Технология | Назначение |
|---|---|
| **Three.js** | 3D-рендеринг персонажа, меча, освещения, теней и частиц |
| **Vite** | Модульная сборка и HMR разработка со сверхбыстрым откликом |
| **CSS 3D Transforms** | Аппаратно-ускоренные 3D-карточки со стеклянным градиентом |
| **Web Audio API** | Процедурный синтез футуристических звуковых эффектов |
| **IntersectionObserver** | Изоляция рендеринга внеэкранных 3D-сцен для стабильных 60–120 FPS |
| **HTML5 Canvas 2D** | Высокопроизводительная симуляция частиц в Кибер-Кузнице |

---

## 💻 Установка и быстрый старт

### Требования:
- [Node.js](https://nodejs.org/) (версии 18 или новее)
- Git

### 1. Клонирование репозитория
```bash
git clone https://github.com/LazizYT/first_project.git
cd first_project
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Запуск сервера разработки
```bash
npm run dev
```
После запуска откройте в браузере **`http://localhost:3000/`**.

### 4. Сборка для продакшена
```bash
npm run build
```
Собранные оптимизированные файлы появятся в директории `dist/`.

---

## 📁 Структура проекта

```
first_project/
├── docs/
│   └── images/              # Скриншоты и превью для документации
├── public/
│   ├── images/              # Текстуры и арты карточек (card_1..7)
│   ├── videos/              # Зацикленные видео-ролики карточек (video_1..3)
│   ├── flaming-sword.glb    # 3D-модель пылающего клинка
│   └── oni-samurai.glb      # 3D-модель Они-Самурая
├── src/
│   ├── audio.js             # Синтезатор звуков Web Audio API
│   ├── main.js              # Инициализация приложения, observer'ы и кузница
│   ├── ninjaModel.js        # Управление Three.js моделью и трекингом глаз
│   ├── scene.js             # Главная Three.js сцена самурая
│   ├── spiralGallery.js     # 3D-спираль карточек и орбитальная математика
│   ├── styles.css           # Полная стилизация, анимации, HUD и адаптив
│   └── swordScene.js        # Three.js сцена вертикального огненного меча
├── index.html               # Разметка всех игровых секций
├── package.json
└── README.md
```

---

<div align="center">
  <sub>Создано с использованием передовых веб-технологий и Three.js. Репозиторий: <a href="https://github.com/LazizYT/first_project">LazizYT/first_project</a></sub>
</div>
