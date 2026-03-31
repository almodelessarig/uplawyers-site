(function () {
  'use strict';

  // ===== HEADER SCROLL SHADOW =====
  var header = document.querySelector('.h-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ===== QUIZ =====
  var quizData = [
    {
      label: 'Шаг 1 из 3',
      question: 'Какой у вас формат бизнеса?',
      options: [
        { icon: '\u{1F37D}\uFE0F', text: 'Ресторан' },
        { icon: '\u2615', text: 'Кафе / Кофейня' },
        { icon: '\u{1F37A}', text: 'Бар / Паб' },
        { icon: '\u{1F3E2}', text: 'Сеть заведений' },
      ],
    },
    {
      label: 'Шаг 2 из 3',
      question: 'Сколько человек работает в вашем бизнесе?',
      options: [
        { icon: '\u{1F464}', text: 'До 15 человек' },
        { icon: '\u{1F465}', text: '15\u201350 человек' },
        { icon: '\u{1F3E2}', text: '50+ человек (сеть или крупный объект)' },
      ],
    },
    {
      label: 'Шаг 3 из 3',
      question: 'Что сейчас беспокоит больше всего?',
      options: [
        { icon: '\u{1F3E2}', text: 'Договор аренды \u2014 условия не устраивают' },
        { icon: '\u{1F69B}', text: 'Проблемы с поставщиками' },
        { icon: '\u{1F468}\u200D\u{1F373}', text: 'Трудовые споры / сотрудники' },
        { icon: '\u{1F50D}', text: 'Проверки госорганов' },
        { icon: '\u{1F4C8}', text: 'Открываю новую точку / продаю франшизу' },
        { icon: '\u{1F4A1}', text: 'Хочу разобраться в целом' },
      ],
    },
  ];

  var currentStep = 0;
  var answers = [];
  var overlay = document.getElementById('hQuizOverlay');

  if (!overlay) return;

  var modal = overlay.querySelector('.h-quiz-modal');
  var progressBar = overlay.querySelector('.h-quiz-progress-bar');
  var stepLabel = overlay.querySelector('.h-quiz-step-label');
  var questionEl = overlay.querySelector('.h-quiz-question');
  var optionsEl = overlay.querySelector('.h-quiz-options');
  var finalEl = overlay.querySelector('.h-quiz-final');
  var closeBtn = overlay.querySelector('.h-quiz-close');

  function openQuiz() {
    currentStep = 0;
    answers.length = 0;
    renderStep();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuiz() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function renderStep() {
    if (currentStep >= quizData.length) {
      showFinal();
      return;
    }
    var step = quizData[currentStep];
    var progress = ((currentStep + 1) / (quizData.length + 1)) * 100;

    progressBar.style.width = progress + '%';
    stepLabel.textContent = step.label;
    questionEl.textContent = step.question;
    optionsEl.innerHTML = '';
    optionsEl.style.display = 'flex';
    finalEl.style.display = 'none';

    step.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'h-quiz-option';
      btn.innerHTML = '<span>' + opt.icon + '</span><span>' + opt.text + '</span>';
      btn.addEventListener('click', function () {
        answers.push(opt.text);
        btn.classList.add('selected');
        setTimeout(function () {
          currentStep++;
          renderStep();
        }, 250);
      });
      optionsEl.appendChild(btn);
    });
  }

  function showFinal() {
    progressBar.style.width = '100%';
    stepLabel.textContent = '';
    questionEl.textContent = '';
    optionsEl.style.display = 'none';
    finalEl.style.display = 'block';
  }

  // Quiz form submit
  var quizForm = document.getElementById('hQuizForm');
  if (quizForm) {
    quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = quizForm.querySelector('[name="quiz_name"]');
      var phone = quizForm.querySelector('[name="quiz_phone"]');
      var valid = true;

      name.classList.remove('error');
      phone.classList.remove('error');
      name.parentElement.classList.remove('has-error');
      phone.parentElement.classList.remove('has-error');

      if (!name.value.trim()) {
        name.classList.add('error');
        name.parentElement.classList.add('has-error');
        valid = false;
      }
      if (!phone.value.trim()) {
        phone.classList.add('error');
        phone.parentElement.classList.add('has-error');
        valid = false;
      }
      if (!valid) return;

      console.log('HoReCa Quiz submitted:', { answers: answers, name: name.value.trim(), phone: phone.value.trim() });
      window.location.href = 'thank_horeca.html';
    });
  }

  closeBtn.addEventListener('click', closeQuiz);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeQuiz(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('active')) closeQuiz(); });

  document.querySelectorAll('[data-horeca-quiz]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openQuiz();
    });
  });

  // ===== BOTTOM FORM =====
  var ctaForm = document.getElementById('hCtaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameF = ctaForm.querySelector('[name="name"]');
      var phoneF = ctaForm.querySelector('[name="phone"]');
      var valid = true;

      nameF.classList.remove('error');
      phoneF.classList.remove('error');
      nameF.parentElement.classList.remove('has-error');
      phoneF.parentElement.classList.remove('has-error');

      if (!nameF.value.trim()) {
        nameF.classList.add('error');
        nameF.parentElement.classList.add('has-error');
        valid = false;
      }
      if (!phoneF.value.trim()) {
        phoneF.classList.add('error');
        phoneF.parentElement.classList.add('has-error');
        valid = false;
      }
      if (!valid) return;

      console.log('HoReCa CTA form:', { name: nameF.value.trim(), phone: phoneF.value.trim(), type: ctaForm.querySelector('[name="venue_type"]').value });
      window.location.href = 'thank_horeca.html';
    });
  }

  // ===== CASES DOTS =====
  var casesWrap = document.querySelector('.h-cases-wrap');
  var dots = document.querySelectorAll('.h-cases-dot');
  if (casesWrap && dots.length) {
    casesWrap.addEventListener('scroll', function () {
      var card = casesWrap.querySelector('.h-case-card');
      if (!card) return;
      var idx = Math.round(casesWrap.scrollLeft / (card.offsetWidth + 16));
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    });
  }
})();
