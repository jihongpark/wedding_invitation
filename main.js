document.addEventListener('DOMContentLoaded', function () {
  // Hero 이미지 로딩될 때까지 오버레이 유지
  const heroImg = document.querySelector('.hero-image');
  const heroLoader = document.getElementById('hero-loader');
  if (heroImg && heroLoader) {
    if (heroImg.complete) {
      heroLoader.style.opacity = 0;
      setTimeout(() => heroLoader.style.display = 'none', 350);
    } else {
      heroImg.addEventListener('load', () => {
        heroLoader.style.opacity = 0;
        setTimeout(() => heroLoader.style.display = 'none', 350);
      });
    }
  }
  // ===== 인트로 애니메이션 - 컨페티와 리본 (CodePen 코드)
  var retina = window.devicePixelRatio,
      PI = Math.PI,
      sqrt = Math.sqrt,
      round = Math.round,
      random = Math.random,
      cos = Math.cos,
      sin = Math.sin,
      rAF = window.requestAnimationFrame,
      cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame,
      _now = Date.now || function () { return new Date().getTime(); };

  (function (w) {
    var prev = _now();
    function fallback(fn) {
      var curr = _now();
      var ms = Math.max(0, 16 - (curr - prev));
      var req = setTimeout(fn, ms);
      prev = curr;
      return req;
    }
    var cancel = w.cancelAnimationFrame
    || w.webkitCancelAnimationFrame
    || w.clearTimeout;
    rAF = w.requestAnimationFrame
    || w.webkitRequestAnimationFrame
    || fallback;
    cAF = function (id) { cancel.call(w, id); };
  }(window));

  var speed = 50,
    duration = (1.0 / speed),
    confettiRibbonCount = 4,
    ribbonPaperCount = 25,
    ribbonPaperDist = 8.0,
    ribbonPaperThick = 4.0,
    confettiPaperCount = 95,
    DEG_TO_RAD = PI / 180,
    RAD_TO_DEG = 180 / PI,
    colors = [
      ["#B7F2FF", "#97E0D2"],
      ["#FFAE6B", "#E98A6A"],
      ["#FFF4BF", "#FFE76D"]
    ];

  function Vector2(_x, _y) {
    this.x = _x, this.y = _y;
    this.Length = function () { return sqrt(this.SqrLength()); }
    this.SqrLength = function () { return this.x * this.x + this.y * this.y; }
    this.Add = function (_vec) { this.x += _vec.x; this.y += _vec.y; }
    this.Sub = function (_vec) { this.x -= _vec.x; this.y -= _vec.y; }
    this.Div = function (_f) { this.x /= _f; this.y /= _f; }
    this.Mul = function (_f) { this.x *= _f; this.y *= _f; }
    this.Normalize = function () {
      var sqrLen = this.SqrLength();
      if (sqrLen != 0) {
        var factor = 1.0 / sqrt(sqrLen);
        this.x *= factor; this.y *= factor;
      }
    }
    this.Normalized = function () {
      var sqrLen = this.SqrLength();
      if (sqrLen != 0) {
        var factor = 1.0 / sqrt(sqrLen);
        return new Vector2(this.x * factor, this.y * factor);
      }
      return new Vector2(0, 0);
    }
  }
  Vector2.Lerp = function (_vec0, _vec1, _t) {
    return new Vector2((_vec1.x - _vec0.x) * _t + _vec0.x, (_vec1.y - _vec0.y) * _t + _vec0.y);
  }
  Vector2.Distance = function (_vec0, _vec1) {
    return sqrt(Vector2.SqrDistance(_vec0, _vec1));
  }
  Vector2.SqrDistance = function (_vec0, _vec1) {
    var x = _vec0.x - _vec1.x, y = _vec0.y - _vec1.y;
    return (x * x + y * y);
  }
  Vector2.Scale = function (_vec0, _vec1) {
    return new Vector2(_vec0.x * _vec1.x, _vec0.y * _vec1.y);
  }
  Vector2.Min = function (_vec0, _vec1) {
    return new Vector2(Math.min(_vec0.x, _vec1.x), Math.min(_vec0.y, _vec1.y));
  }
  Vector2.Max = function (_vec0, _vec1) {
    return new Vector2(Math.max(_vec0.x, _vec1.x), Math.max(_vec0.y, _vec1.y));
  }
  Vector2.ClampMagnitude = function (_vec0, _len) {
    var vecNorm = _vec0.Normalized();
    return new Vector2(vecNorm.x * _len, vecNorm.y * _len);
  }
  Vector2.Sub = function (_vec0, _vec1) {
    return new Vector2(_vec0.x - _vec1.x, _vec0.y - _vec1.y);
  }

  function EulerMass(_x, _y, _mass, _drag) {
    this.position = new Vector2(_x, _y);
    this.mass = _mass;
    this.drag = _drag;
    this.force = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
    this.AddForce = function (_f) { this.force.Add(_f); }
    this.Integrate = function (_dt) {
      var acc = this.CurrentForce(this.position);
      acc.Div(this.mass);
      var posDelta = new Vector2(this.velocity.x, this.velocity.y);
      posDelta.Mul(_dt);
      this.position.Add(posDelta);
      acc.Mul(_dt);
      this.velocity.Add(acc);
      this.force = new Vector2(0, 0);
    }
    this.CurrentForce = function (_pos, _vel) {
      var totalForce = new Vector2(this.force.x, this.force.y);
      var speed = this.velocity.Length();
      var dragVel = new Vector2(this.velocity.x, this.velocity.y);
      dragVel.Mul(this.drag * this.mass * speed);
      totalForce.Sub(dragVel);
      return totalForce;
    }
  }

  function ConfettiPaper(_x, _y) {
    this.pos = new Vector2(_x, _y);
    this.rotationSpeed = (random() * 600 + 800);
    this.angle = DEG_TO_RAD * random() * 360;
    this.rotation = DEG_TO_RAD * random() * 360;
    this.cosA = 1.0;
    this.size = 4.0;
    this.oscillationSpeed = (random() * 1.5 + 0.5);
    this.xSpeed = 40.0;
    this.ySpeed = (random() * 60 + 50.0);
    this.corners = new Array();
    this.time = random();
    this.visible = true;
    var ci = round(random() * (colors.length - 1));
    this.frontColor = colors[ci][0];
    this.backColor = colors[ci][1];
    for (var i = 0; i < 4; i++) {
      var dx = cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
      var dy = sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
      this.corners[i] = new Vector2(dx, dy);
    }
    this.Update = function (_dt) {
      if (!this.visible) return;
      this.time += _dt;
      this.rotation += this.rotationSpeed * _dt;
      this.cosA = cos(DEG_TO_RAD * this.rotation);
      this.pos.x += cos(this.time * this.oscillationSpeed) * this.xSpeed * _dt
      this.pos.y += this.ySpeed * _dt;
      if (this.pos.y > ConfettiPaper.bounds.y) {
        if (ConfettiPaper.stopGenerating) {
          this.visible = false;
        } else {
          this.pos.x = random() * ConfettiPaper.bounds.x;
          this.pos.y = 0;
        }
      }
    }
    this.Draw = function (_g) {
      if (!this.visible || this.pos.y > ConfettiPaper.bounds.y + 50) return;
      if (this.cosA > 0) {
        _g.fillStyle = this.frontColor;
      } else {
        _g.fillStyle = this.backColor;
      }
      _g.beginPath();
      _g.moveTo((this.pos.x + this.corners[0].x * this.size) * retina, (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina);
      for (var i = 1; i < 4; i++) {
        _g.lineTo((this.pos.x + this.corners[i].x * this.size) * retina, (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina);
      }
      _g.closePath();
      _g.fill();
    }
  }
  ConfettiPaper.bounds = new Vector2(0, 0);
  ConfettiPaper.stopGenerating = false;
  ConfettiPaper.bounds = new Vector2(0, 0);

  function ConfettiRibbon(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
    this.particleDist = _dist;
    this.particleCount = _count;
    this.particleMass = _mass;
    this.particleDrag = _drag;
    this.particles = new Array();
    this.visible = true;
    var ci = round(random() * (colors.length - 1));
    this.frontColor = colors[ci][0];
    this.backColor = colors[ci][1];
    this.xOff = (cos(DEG_TO_RAD * _angle) * _thickness);
    this.yOff = (sin(DEG_TO_RAD * _angle) * _thickness);
    this.position = new Vector2(_x, _y);
    this.prevPosition = new Vector2(_x, _y);
    this.velocityInherit = (random() * 2 + 4);
    this.time = random() * 100;
    this.oscillationSpeed = (random() * 2 + 2);
    this.oscillationDistance = (random() * 40 + 40);
    this.ySpeed = (random() * 60 + 100);
    for (var i = 0; i < this.particleCount; i++) {
      this.particles[i] = new EulerMass(_x, _y - i * this.particleDist, this.particleMass, this.particleDrag);
    }
    this.Update = function (_dt) {
      if (!this.visible) return;
      var i = 0;
      this.time += _dt * this.oscillationSpeed;
      this.position.y += this.ySpeed * _dt;
      this.position.x += cos(this.time) * this.oscillationDistance * _dt;
      this.particles[0].position = this.position;
      var dX = this.prevPosition.x - this.position.x;
      var dY = this.prevPosition.y - this.position.y;
      var delta = sqrt(dX * dX + dY * dY);
      this.prevPosition = new Vector2(this.position.x, this.position.y);
      for (i = 1; i < this.particleCount; i++) {
        var dirP = Vector2.Sub(this.particles[i - 1].position, this.particles[i].position);
        dirP.Normalize();
        dirP.Mul((delta / _dt) * this.velocityInherit);
        this.particles[i].AddForce(dirP);
      }
      for (i = 1; i < this.particleCount; i++) {
        this.particles[i].Integrate(_dt);
      }
      for (i = 1; i < this.particleCount; i++) {
        var rp2 = new Vector2(this.particles[i].position.x, this.particles[i].position.y);
        rp2.Sub(this.particles[i - 1].position);
        rp2.Normalize();
        rp2.Mul(this.particleDist);
        rp2.Add(this.particles[i - 1].position);
        this.particles[i].position = rp2;
      }
      if (this.position.y > ConfettiRibbon.bounds.y + this.particleDist * this.particleCount) {
        if (ConfettiRibbon.stopGenerating) {
          this.visible = false;
        } else {
          this.Reset();
        }
      }
    }
    this.Reset = function () {
      var maxStartOffset = ConfettiRibbon.bounds.y * 0.8;
      var minStartOffset = ConfettiRibbon.bounds.y * 0.1;
      this.position.y = -(minStartOffset + random() * (maxStartOffset - minStartOffset));
      this.position.x = random() * ConfettiRibbon.bounds.x;
      this.prevPosition = new Vector2(this.position.x, this.position.y);
      this.velocityInherit = random() * 2 + 4;
      this.time = random() * 100;
      this.oscillationSpeed = random() * 2.0 + 1.5;
      this.oscillationDistance = (random() * 40 + 40);
      this.ySpeed = random() * 40 + 80;
      var ci = round(random() * (colors.length - 1));
      this.frontColor = colors[ci][0];
      this.backColor = colors[ci][1];
      this.particles = new Array();
      for (var i = 0; i < this.particleCount; i++) {
        this.particles[i] = new EulerMass(this.position.x, this.position.y - i * this.particleDist, this.particleMass, this.particleDrag);
      }
    }
    this.Draw = function (_g) {
      if (!this.visible || this.position.y > ConfettiRibbon.bounds.y + 100) return;
      for (var i = 0; i < this.particleCount - 1; i++) {
        var p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
        var p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
        if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
          _g.fillStyle = this.frontColor; _g.strokeStyle = this.frontColor;
        } else {
          _g.fillStyle = this.backColor; _g.strokeStyle = this.backColor;
        }
        if (i == 0) {
          _g.beginPath();
          _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
          _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
          _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
          _g.closePath();
          _g.stroke(); _g.fill();
          _g.beginPath();
          _g.moveTo(p1.x * retina, p1.y * retina);
          _g.lineTo(p0.x * retina, p0.y * retina);
          _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
          _g.closePath();
          _g.stroke(); _g.fill();
        } else if (i == this.particleCount - 2) {
          _g.beginPath();
          _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
          _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
          _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
          _g.closePath(); _g.stroke(); _g.fill();
          _g.beginPath();
          _g.moveTo(p1.x * retina, p1.y * retina);
          _g.lineTo(p0.x * retina, p0.y * retina);
          _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
          _g.closePath(); _g.stroke(); _g.fill();
        } else {
          _g.beginPath();
          _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
          _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
          _g.lineTo(p1.x * retina, p1.y * retina);
          _g.lineTo(p0.x * retina, p0.y * retina);
          _g.closePath(); _g.stroke(); _g.fill();
        }
      }
    }
    this.Side = function(x1, y1, x2, y2, x3, y3) { return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2)); }
  }
  ConfettiRibbon.bounds = new Vector2(0, 0);
  ConfettiRibbon.stopGenerating = false;
  ConfettiRibbon.bounds = new Vector2(0, 0);
  
  var confettiContext = {};
  confettiContext.Context = function(id) {
    var i = 0;
    var canvas = document.getElementById(id);
    if (!canvas) return;
    var canvasParent = canvas.parentNode;
    var canvasWidth = canvasParent.offsetWidth;
    var canvasHeight = canvasParent.offsetHeight;
    canvas.width = canvasWidth * retina;
    canvas.height = canvasHeight * retina;
    var context = canvas.getContext('2d');
    var interval = null;
    var confettiRibbons = new Array();
    ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
    for (i = 0; i < confettiRibbonCount; i++) {
      var maxStartOffset = canvasHeight * 0.8;
      var minStartOffset = canvasHeight * 0.1;
      var progress = confettiRibbonCount > 1 ? (i / (confettiRibbonCount - 1)) : 0;
      var startY = -(minStartOffset + (maxStartOffset - minStartOffset) * progress + random() * canvasHeight * 0.15);
      confettiRibbons[i] = new ConfettiRibbon(random() * canvasWidth, startY, ribbonPaperCount, ribbonPaperDist, ribbonPaperThick, 45, 1, 0.05);
    }
    var confettiPapers = new Array();
    ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
    for (i = 0; i < confettiPaperCount; i++) {
      confettiPapers[i] = new ConfettiPaper(random() * canvasWidth, random() * canvasHeight);
    }
    this.resize = function() {
      canvasWidth = canvasParent.offsetWidth;
      canvasHeight = canvasParent.offsetHeight;
      canvas.width = canvasWidth * retina;
      canvas.height = canvasHeight * retina;
      ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
      ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
    }
    this.start = function() {
      this.stop();
      var context = this;
      this.update();
    }
    this.stop = function() { cAF(this.interval); }
    var self = this;
    var hasVisibleItems = true;
    this.update = function() {
      var i = 0;
      context.clearRect(0, 0, canvas.width, canvas.height);
      hasVisibleItems = false;
      for (i = 0; i < confettiPaperCount; i++) {
        confettiPapers[i].Update(duration);
        if (confettiPapers[i].visible) {
          hasVisibleItems = true;
          confettiPapers[i].Draw(context);
        }
      }
      for (i = 0; i < confettiRibbonCount; i++) {
        confettiRibbons[i].Update(duration);
        if (confettiRibbons[i].visible) {
          hasVisibleItems = true; confettiRibbons[i].Draw(context);
        }
      }
      if (hasVisibleItems) {
        self.interval = rAF(function () { self.update(); });
      }
    }
  }

  var confetti = new confettiContext.Context('confetti');
  if (confetti && confetti.start) {
    confetti.start();
    setTimeout(function () {
      ConfettiPaper.stopGenerating = true;
      ConfettiRibbon.stopGenerating = true;
    }, 2000);
  }
  window.addEventListener('resize', function (event) {
    if (confetti && confetti.resize) {
      confetti.resize();
    }
  });

  // ===== intro section 스크롤(fade-in) 애니메이션 =====
  const descParagraphs = document.querySelectorAll('.desc-paragraph');
  const descDivider = document.querySelector('.desc-divider');

  if (descParagraphs.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40% 0px',
      threshold: 0,
    };
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const index = Array.from(descParagraphs).indexOf(entry.target);
          if (index === 0) {
            descParagraphs[0].classList.add('visible');
            descParagraphs[1].classList.add('visible');
            descParagraphs[2].classList.add('visible');
            observer.unobserve(descParagraphs[0]);
            observer.unobserve(descParagraphs[1]);
            observer.unobserve(descParagraphs[2]);
          } else if (index === 1 || index === 2) {
            return;
          } else if (index === 3) {
            entry.target.classList.add('visible');
            if (descDivider) {
              descDivider.classList.add('visible');
            }
            observer.unobserve(entry.target);
            if (descDivider) observer.unobserve(descDivider);
          }
        }
      });
    }, observerOptions);
    descParagraphs.forEach(function(paragraph) {
      observer.observe(paragraph);
    });
    if (descDivider) {
      observer.observe(descDivider);
    }
  }
// ===== account 박스 chevron toggle =====
document.querySelectorAll('.account .chevron').forEach(icon => {
  icon.addEventListener('click', (e) => {
    const accountBox = icon.closest('.account');
    accountBox.classList.toggle('open');
  });
});
// ===== 계좌 복사 기능 =====
document.querySelectorAll('.copy-account').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.closest('.account-detail').querySelector('.account-number').innerText;
    navigator.clipboard.writeText(text).then(() => {
      btn.innerText = "done"; // 복사 성공시 체크
      setTimeout(() => btn.innerText = "content_copy", 900);
    });
  });
});
// ===== Wedding Photo 섹션 전체화면 이미지 뷰어 (복구) =====
const images = document.querySelectorAll('.photos .photo-item');
const viewer = document.getElementById('image-viewer');
const viewerImage = document.getElementById('viewer-image');
const closeBtn = document.getElementById('close-image-viewer');
const prevBtn = document.getElementById('prev-image');
const nextBtn = document.getElementById('next-image');
let currentIndex = 0;

function showViewer(idx) {
    if (!viewer || !viewerImage) return;
    currentIndex = idx;
    viewerImage.src = images[idx].src;
    viewer.style.display = 'flex';
    // 이미지 번호/전체 표시 업데이트
    const viewerCount = document.getElementById('viewer-count');
    if (viewerCount) {
        viewerCount.textContent = `${currentIndex + 1} / ${images.length}`;
    }
    // Prev/Next 버튼 상태 토글 (disabled + opacity 동시 유지)
    if (prevBtn) {
        prevBtn.disabled = (currentIndex === 0);
        prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
        prevBtn.style.cursor = prevBtn.disabled ? 'default' : 'pointer';
    }
    if (nextBtn) {
        nextBtn.disabled = (currentIndex === images.length - 1);
        nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
        nextBtn.style.cursor = nextBtn.disabled ? 'default' : 'pointer';
    }
}
function hideViewer() {
    if (!viewer) return;
    viewer.style.display = 'none';
}
function showPrev() {
    if (currentIndex > 0) showViewer(currentIndex - 1);
}
function showNext() {
    if (currentIndex < images.length - 1) showViewer(currentIndex + 1);
}
images.forEach((img, idx) => {
    img.addEventListener('click', () => showViewer(idx));
});
if (closeBtn) closeBtn.addEventListener('click', hideViewer);
if (prevBtn) prevBtn.addEventListener('click', showPrev);
if (nextBtn) nextBtn.addEventListener('click', showNext);
// 검정 배경 클릭시 닫히는 동작 제거 (아무 동작 없음)
// if (viewer) viewer.addEventListener('click', e => {
//     if (e.target === viewer) hideViewer();
// });

// 전체화면 이미지 뷰어에서 스와이프 동작(좌우 이동)
if (viewer) {
    let startX = null;
    let deltaX = 0;
    let threshold = 40; // 넘김 인식 최소 px
    viewer.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) startX = e.touches[0].clientX;
    });
    viewer.addEventListener('touchmove', (e) => {
        if (startX !== null) deltaX = e.touches[0].clientX - startX;
    });
    viewer.addEventListener('touchend', (e) => {
        if (startX !== null) {
            if (deltaX > threshold) { showPrev(); }
            else if (deltaX < -threshold) { showNext(); }
        }
        startX = null; deltaX = 0;
    });

    // [추가] 전체화면 뷰어 클릭 시 좌/우측 영역 판별하여 페이지 이동
    if (viewerImage) {
        viewerImage.addEventListener('click', (e) => {
            const rect = viewerImage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width * 0.6 && currentIndex < images.length - 1) {
                showNext();
            } else if (x < rect.width * 0.4 && currentIndex > 0) {
                showPrev();
            }
        });
    }

    // 마우스 드래그(PC용 간단 버전)
    let mouseDown = false, mouseStartX = null, mouseMoveX = 0;
    viewer.addEventListener('mousedown', (e) => {
        mouseDown = true; mouseStartX = e.clientX;
    });
    viewer.addEventListener('mousemove', (e) => {
        if (mouseDown && mouseStartX !== null) mouseMoveX = e.clientX - mouseStartX;
    });
    viewer.addEventListener('mouseup', (e) => {
        if (mouseDown && mouseStartX !== null) {
            if (mouseMoveX > threshold) { showPrev(); }
            else if (mouseMoveX < -threshold) { showNext(); }
        }
        mouseDown = false; mouseStartX = null; mouseMoveX = 0;
    });
}



// ... 이하 기존 사용자 코드 ...
});

document.addEventListener('DOMContentLoaded', function () {
  const carousel = document.querySelector('.timeline-images');
  let interval, pauseTimeout;
  let speed = 1; // 한 번에 움직일 px (↓더 느리게=0.5, 더 빠르게=2로 조절)
  function autoFlow() {
    if (!carousel) return;
    carousel.scrollLeft += speed;
    // 다 오른쪽 끝이면 맨 앞으로 돌아감
    if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1) {
      carousel.scrollLeft = 0;
    }
  }
  function startAutoFlow() {
    clearInterval(interval);
    interval = setInterval(autoFlow, 20); // 20ms(0.02초)에 1px씩 움직임 (더 빠르게/느리게 가능)
  }
  function pauseAutoFlow() {
    clearInterval(interval);
    clearTimeout(pauseTimeout);
    pauseTimeout = setTimeout(startAutoFlow, 4000); // 손대면 4초 멈췄다 다시 흐름 재개
  }
  if (carousel) {
    startAutoFlow();
    ['touchstart', 'mousedown', 'wheel', 'pointerdown'].forEach(eventName => {
      carousel.addEventListener(eventName, pauseAutoFlow, { passive: true });
    });
  }
});


