// main.js
import { c_modele } from './data.js';

const $podlozeSelect = $('[data-name="c_podloze"] select');
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

    // Build calculation summary
    let summaryHtml = `
        <div style="background:#f0f8ff; padding:1rem; border-left:4px solid #007bff; margin:1rem 0; font-family:monospace; font-size:0.95rem;">
            <strong>Obliczenia:</strong><br>
            • Podłoże: <strong>${podlozeLabel}</strong><br>
            • Grubość izolacji: <strong>${grubIzolacji} mm</strong><br>
            • Warstwa kleju i tynku: <strong>${grubKlej} mm</strong><br>
            • Zaślepka: <strong>${grubZaslepka} mm</strong><br>
            <hr style="border:0; border-top:1px dashed #aaa; margin:0.5rem 0;">
    `;

    validModels.forEach(model => {
        const hef = model.hef[category];
        if (hef === undefined) return;

        const required = grubIzolacji + grubKlej + hef - grubZaslepka;
        const available = model.availableLengths
            .filter(l => l >= required)
            .sort((a, b) => a - b)[0];

        if (available) {
            suggestions.push({ name: model.name, hef, required, length: available, pdf: model.pdfLink });

            // Add per-model calc line
            summaryHtml += `• <strong>${model.name}</strong>: ${grubIzolacji} + ${grubKlej} + ${hef} − ${grubZaslepka} = <strong>${required} mm</strong> → <strong>${available} mm</strong><br>`;
        }
    });

    summaryHtml += `</div>`;

    if (suggestions.length === 0) {
        $results.html('<p style="color:#c00;">Brak pasujących modeli.</p>');
        return;
    }

    // Final results
    let resultsHtml = '<h4 style="margin-top:1.5rem;">Zalecane modele:</h4><ul style="padding:0; list-style:none;">';
    suggestions.forEach(s => {
        resultsHtml += `
            <li style="margin:1rem 0; padding:1rem; border:1px solid #ddd; border-radius:6px; background:#f9f9f9;">
                <strong>${s.name}</strong><br>
                hef = ${s.hef} mm → wymagana długość: <strong>${s.required} mm</strong> → <strong>${s.length} mm</strong>
            </li>`;
    });
    resultsHtml += '</ul>';

    // Combine: summary + results
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