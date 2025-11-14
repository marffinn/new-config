// main.js
import { c_modele } from './data.js';

const $podlozeSelect = $('[data-name="c_podloze"] select');
const $izolacjaTypSelect = $('[data-name="typ_izolacji"] select'); // <-- NEW
const $zaslepkaInput = $('[data-name="montaz_z_zaslepka"] input');
const $izolacjaInput = $('[data-name="grubosc_izolacji"] input');
const $klejInput = $('[data-name="grubosc_warstwy_kleju"] input');
const $results = $('.results');

// Value displays
$('[data-name="montaz_z_zaslepka"] label').after(' <strong class="value-display">20 mm</strong>');
$('[data-name="grubosc_izolacji"] label').after(' <strong class="value-display">90 mm</strong>');
$('[data-name="grubosc_warstwy_kleju"] label').after(' <strong class="value-display">20 mm</strong>');

const $zaslepkaValue = $('[data-name="montaz_z_zaslepka"] .value-display');
const $izolacjaValue = $('[data-name="grubosc_izolacji"] .value-display');
const $klejValue = $('[data-name="grubosc_warstwy_kleju"] .value-display');

function updateValues() {
    $zaslepkaValue.text($zaslepkaInput.val() + ' mm');
    $izolacjaValue.text($izolacjaInput.val() + ' mm');
    $klejValue.text($klejInput.val() + ' mm');
}

function filtruj_modele() {
    const category = $podlozeSelect.val();
    const izolacjaTyp = $izolacjaTypSelect.val(); // <-- NEW
    const grubZaslepka = parseInt($zaslepkaInput.val(), 10) || 0;
    const grubIzolacji = parseInt($izolacjaInput.val(), 10) || 0;
    const grubKlej = parseInt($klejInput.val(), 10) || 0;

    if (!category) {
        $results.html('<p style="color:#c00;">Wybierz podłoże.</p>');
        return;
    }

    const podlozeLabel = $podlozeSelect.find('option:selected').text();

    const validModels = c_modele.filter(m => m.categories.includes(category));
    const suggestions = [];

    let summaryHtml = `
        <div style="background:#f0f8ff; padding:.6rem .8rem; border-left:3px solid #1976d2; margin:0 0 .8rem 0; border-radius:0 6px 6px 0; font-size:.8rem; color:#0d47a1;">
            <strong>Obliczenia:</strong><br>
            • Podłoże: <strong>${podlozeLabel}</strong><br>
            • Izolacja: <strong>${grubIzolacji} mm</strong> 
              (${izolacjaTyp === 'MW' ? 'Wełna mineralna → tylko z trzpieniem metalowym' : 'Styropian'})<br>
            • Klej + tynk: <strong>${grubKlej} mm</strong><br>
            • Zaślepka: <strong>${grubZaslepka} mm</strong><br>
            <hr style="display:none;">
    `;

    validModels.forEach(model => {
        const hef = model.hef[category];
        if (hef === undefined) return;

        // CRITICAL: Only allow models with metal pin if MW is selected
        if (izolacjaTyp === 'MW' && !model.hasMetalPin) return;

        const required = grubIzolacji + grubKlej + hef - grubZaslepka;
        const available = model.availableLengths
            .filter(l => l >= required)
            .sort((a, b) => a - b)[0];

        if (available) {
            suggestions.push({ name: model.name, hef, required, length: available, pdf: model.pdfLink });

            summaryHtml += `• <strong>${model.name}</strong>: ${grubIzolacji} + ${grubKlej} + ${hef} − ${grubZaslepka} = <strong>${required} mm</strong> → <strong>${available} mm</strong><br>`;
        }
    });

    summaryHtml += `</div>`;

    if (suggestions.length === 0) {
        $results.html('<p style="color:#c00;">Brak pasujących modeli.</p>');
        return;
    }

    let resultsHtml = '<h4 style="margin:0 0 .6rem; font-size:1rem; color:#1565c0; font-weight:600; border-bottom:1px solid #bbdefb; padding-bottom:.2rem;">Zalecane modele:</h4><ul style="padding:0; margin:0; display:grid; gap:.6rem;">';
    suggestions.forEach(s => {
        resultsHtml += `
            <li style="background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:.7rem .9rem; font-size:.85rem; line-height:1.4; box-shadow:0 1px 3px rgba(0,0,0,.06);">
                <strong style="color:#1976d2; font-size:.9rem;">${s.name}</strong><br>
                hef = ${s.hef} mm → wymagana: <strong>${s.required} mm</strong> → <strong>${s.length} mm</strong>
            </li>`;
    });
    resultsHtml += '</ul>';

    $results.html(summaryHtml + resultsHtml);
}

// Events
$zaslepkaInput.on('input', updateValues);
$izolacjaInput.on('input', updateValues);
$klejInput.on('input', updateValues);
updateValues();

$(document).ready(function () {
    $('.suggest_step').on('click', filtruj_modele);
});

$(document).on('change', '.steps', function () {
    filtruj_modele();
    updateValues();
});