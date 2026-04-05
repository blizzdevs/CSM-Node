/**
 * src/public/js/main.js
 * Interactividad básica — Heaven UI
 */

'use strict';

// ── Tab system (home page) ────────────────────────────────────────
document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    tabGroup.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            // Desactivar todos en este grupo
            tabGroup.querySelectorAll('.tab-btn').forEach(function (b) {
                b.classList.remove('active');
            });

            // Ocultar todos los paneles del grupo padre
            var parent = tabGroup.parentElement;
            parent.querySelectorAll('.tab-panel').forEach(function (p) {
                p.classList.remove('active');
            });

            // Activar el seleccionado
            btn.classList.add('active');
            var target = document.getElementById(btn.dataset.tab);
            if (target) target.classList.add('active');
        });
    });
});
