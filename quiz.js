// ===== QUIZ LOGIC =====
(function () {
  'use strict';

  const quizData = [
    {
      label: 'Шаг 1 из 3',
      question: 'Какой у вас тип медицинского бизнеса?',
      options: [
        { icon: '\u{1F9B7}', text: 'Стоматология' },
        { icon: '\u{1F3E5}', text: 'Медицинский центр / Поликлиника' },
        { icon: '\u{1F486}', text: 'Косметология / Эстетическая медицина' },
        { icon: '\u{1F9EC}', text: 'Другое' },
      ],
    },
    {
      label: 'Шаг 2 из 3',
      question: 'Сколько сотрудников работает в вашей клинике?',
      options: [
        { icon: '\u{1F464}', text: 'До 10 человек' },
        { icon: '\u{1F465}', text: '10\u201330 человек' },
        { icon: '\u{1F3E2}', text: '30+ человек (сеть клиник)' },
      ],
    },
    {
      label: 'Шаг 3 из 3',
      question: 'Что беспокоит вас больше всего?',
      options: [
        { icon: '\u26A0\uFE0F', text: 'Претензии и жалобы пациентов' },
        { icon: '\u{1F4CB}', text: 'Проверки госорганов и лицензирование' },
        { icon: '\u{1F454}', text: 'Трудовые споры с сотрудниками' },
        { icon: '\u{1F4C4}', text: 'Договоры и документы не в порядке' },
        { icon: '\u{1F4A1}', text: 'Просто хочу понять, что не так' },
      ],
    },
  ];

  let currentStep = 0;
  const answers = [];

  const overlay = document.getElementById('quizOverlay');
  const modal = overlay.querySelector('.quiz-modal');
  const progressBar = overlay.querySelector('.quiz-progress-bar');
  const stepLabel = overlay.querySelector('.quiz-step-label');
  const questionEl = overlay.querySelector('.quiz-question');
  const optionsEl = overlay.querySelector('.quiz-options');
  const finalEl = overlay.querySelector('.quiz-final');
  const closeBtn = overlay.querySelector('.quiz-close');

  // Open quiz
  function openQuiz() {
    currentStep = 0;
    answers.length = 0;
    renderStep();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close quiz
  function closeQuiz() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Render question step
  function renderStep() {
    if (currentStep >= quizData.length) {
      showFinal();
      return;
    }
    const step = quizData[currentStep];
    const progress = ((currentStep + 1) / (quizData.length + 1)) * 100;

    progressBar.style.width = progress + '%';
    stepLabel.textContent = step.label;
    questionEl.textContent = step.question;

    optionsEl.innerHTML = '';
    optionsEl.style.display = 'flex';
    finalEl.style.display = 'none';

    step.options.forEach(function (opt, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option';
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

  // Show final / contact form
  function showFinal() {
    progressBar.style.width = '100%';
    stepLabel.textContent = '';
    questionEl.textContent = '';
    optionsEl.style.display = 'none';
    finalEl.style.display = 'block';
  }

  // Quiz form submit
  var quizForm = document.getElementById('quizForm');
  if (quizForm) {
    quizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = quizForm.querySelector('[name="quiz_name"]');
      var phone = quizForm.querySelector('[name="quiz_phone"]');
      var valid = true;

      // Reset
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

      // Collect all data (would be sent to backend in production)
      var formData = {
        answers: answers,
        name: name.value.trim(),
        phone: phone.value.trim(),
      };
      console.log('Quiz submitted:', formData);

      window.location.href = 'thank-you.html';
    });
  }

  // Close button
  closeBtn.addEventListener('click', closeQuiz);

  // Click overlay to close
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeQuiz();
  });

  // Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeQuiz();
  });

  // Bind all CTA buttons
  document.querySelectorAll('[data-quiz]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openQuiz();
    });
  });

  // ===== BOTTOM FORM VALIDATION =====
  var ctaForm = document.getElementById('ctaForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameField = ctaForm.querySelector('[name="name"]');
      var phoneField = ctaForm.querySelector('[name="phone"]');
      var valid = true;

      nameField.classList.remove('error');
      phoneField.classList.remove('error');
      nameField.parentElement.classList.remove('has-error');
      phoneField.parentElement.classList.remove('has-error');

      if (!nameField.value.trim()) {
        nameField.classList.add('error');
        nameField.parentElement.classList.add('has-error');
        valid = false;
      }
      if (!phoneField.value.trim()) {
        phoneField.classList.add('error');
        phoneField.parentElement.classList.add('has-error');
        valid = false;
      }
      if (!valid) return;

      console.log('CTA Form submitted:', {
        name: nameField.value.trim(),
        phone: phoneField.value.trim(),
        clinic_type: ctaForm.querySelector('[name="clinic_type"]').value,
      });

      window.location.href = 'thank-you.html';
    });
  }

  // ===== CASES CAROUSEL DOTS =====
  var casesWrapper = document.querySelector('.cases-wrapper');
  var dots = document.querySelectorAll('.cases-dot');
  if (casesWrapper && dots.length) {
    casesWrapper.addEventListener('scroll', function () {
      var scrollLeft = casesWrapper.scrollLeft;
      var cardWidth = casesWrapper.querySelector('.case-card').offsetWidth + 16;
      var index = Math.round(scrollLeft / cardWidth);
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === index);
      });
    });
  }
})();
