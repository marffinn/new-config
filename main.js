// main.js
import { c_modele } from './data.js';

const $podlozeSelect = $('[data-name="c_podloze"] select');
const $izolacjaTypSelect = $('[data-name="typ_izolacji"] select');
const $zaslepkaInput = $('[data-name="montaz_z_zaslepka"] input');
const $izolacjaInput = $('[data-name="grubosc_izolacji"] input');
const $klejInput = $('[data-name="grubosc_warstwy_kleju"] input');
const $calculation = $('.calculation');
const $results = $('.results');

// Add value displays
$('[data-name="montaz_z_zaslepka"] label').after(' <strong class="value-display">20 mm</strong>');
$('[data-name="grubosc_izolacji"] label').after(' <strong class="value-display">90 mm</strong>');
$('[data-name="grubosc_warstwy_kleju"] label').after(' <strong class="value-display">20 mm</strong>');

const $zaslepkaValue = $('[data-name="montaz_z_zaslepka"] .value-display');
const $izolacjaValue = $('[data-name="grubosc_izolacji"] .value-display');
const $klejValue = $('[data-name="grubosc_warstwy_kleju"] .value-display');

function updateValues() {
    let grubIzolacji = parseInt($izolacjaInput.val(), 10) || 0;
    let grubZaslepka = parseInt($zaslepkaInput.val(), 10) || 0;
    const grubKlej = parseInt($klejInput.val(), 10) || 0;

    // AUTO-CORRECT: Zaślepka must be < izolacja and at least 10 mm shorter
    let corrected = false;
    if (grubZaslepka >= grubIzolacji) {
        grubZaslepka = Math.max(0, grubIzolacji - 10);
        corrected = true;
    } else if (grubIzolacji - grubZaslepka < 10) {
        grubZaslepka = grubIzolacji - 10;
        corrected = true;
    }

    if (corrected) {
        $zaslepkaInput.val(grubZaslepka);
    }

    // Update displays
    $zaslepkaValue.text(grubZaslepka + ' mm');
    $izolacjaValue.text(grubIzolacji + ' mm');
    $klejValue.text(grubKlej + ' mm');

    // Visual feedback
    const $zaslepkaSection = $('[data-name="montaz_z_zaslepka"]');
    const $label = $zaslepkaSection.find('label');
    const $range = $zaslepkaSection.find('input');
    const $value = $zaslepkaSection.find('.value-display');

    if (grubZaslepka >= grubIzolacji) {
        $label.css('color', '#c62828');
        $range.css('border-color', '#c62828');
        $value.css('color', '#c62828');
    } else if (grubIzolacji - grubZaslepka < 10) {
        $label.css('color', '#f57c00');
        $range.css('border-color', '#f57c00');
        $value.css('color', '#f57c00');
    } else {
        $label.css('color', '');
        $range.css('border-color', '');
        $value.css('color', '#1976d2');
    }
}

function filtruj_modele() {
    const category = $podlozeSelect.val();
    const izolacjaTyp = $izolacjaTypSelect.val();
    const grubZaslepka = parseInt($zaslepkaInput.val(), 10) || 0;
    const grubIzolacji = parseInt($izolacjaInput.val(), 10) || 0;
    const grubKlej = parseInt($klejInput.val(), 10) || 0;

    // VALIDATION: Block invalid states
    if (grubZaslepka >= grubIzolacji) {
        $calculation.html('<p style="color:#c62828; font-weight:600; margin:0;">Zaślepka nie może być dłuższa niż izolacja!</p>');
        $results.empty();
        return;
    }
    if (grubIzolacji - grubZaslepka < 10) {
        $calculation.html('<p style="color:#f57c00; font-weight:600; margin:0;">Zaślepka musi być co najmniej 10 mm krótsza od izolacji!</p>');
        $results.empty();
        return;
    }
    if (!category) {
        $calculation.html('<p style="margin:0;">Wybierz podłoże.</p>');
        $results.empty();
        return;
    }

    const podlozeLabel = $podlozeSelect.find('option:selected').text();
    const validModels = c_modele.filter(m => m.categories.includes(category));
    const suggestions = [];

    let calcHtml = `<strong>Obliczenia:</strong><br>
        Podłoże: <strong>${podlozeLabel}</strong><br>
        Izolacja: <strong>${grubIzolacji} mm</strong> 
          (${izolacjaTyp === 'MW' ? 'Wełna → tylko z trzpieniem' : 'Styropian'})<br>
        Klej + tynk: <strong>${grubKlej} mm</strong><br>
        Zaślepka: <strong>${grubZaslepka} mm</strong><br><br>`;

    validModels.forEach(model => {
        const hef = model.hef[category];
        if (hef === undefined) return;
        if (izolacjaTyp === 'MW' && !model.hasMetalPin) return;

        let required = grubIzolacji + grubKlej + hef - grubZaslepka;
        const offset = model.offset || 0;
        const finalRequired = required + offset;

        if (finalRequired <= 0) return;

        const available = model.availableLengths
            .filter(l => l >= finalRequired)
            .sort((a, b) => a - b)[0];

        if (available) {
            suggestions.push({
                name: model.name,
                hef,
                finalRequired,
                length: available,
                offset
            });

            const sign = offset > 0 ? `+` : (offset < 0 ? `−` : ``);
            const abs = Math.abs(offset);
            const offsetText = offset !== 0 ? ` ${sign} ${abs}` : '';
            calcHtml += `<strong>${model.name}</strong>: ${grubIzolacji}+${grubKlej}+${hef}−${grubZaslepka}${offsetText} = <strong>${finalRequired} mm</strong> → <strong>${available} mm</strong><br>`;
        }
    });

    $calculation.html(calcHtml || '<p style="margin:0;">Brak danych.</p>');

    if (suggestions.length === 0) {
        $results.html('<p style="color:#c00; text-align:center; margin:0;">Brak pasujących modeli.</p>');
        return;
    }

    let resultsHtml = '<h4>Zalecane modele:</h4><ul>';
    suggestions.forEach(s => {
        const offsetColor = s.offset > 0 ? '#d32f2f' : (s.offset < 0 ? '#2e7d32' : '');
        const offsetSign = s.offset > 0 ? '+' : '';
        const offsetText = s.offset !== 0 ? `<small style="color:${offsetColor}; font-weight:600;">(${offsetSign}${s.offset} mm)</small>` : '';
        resultsHtml += `
            <li>
                <strong>${s.name}</strong> ${offsetText}<br>
                hef=${s.hef} → <strong>${s.finalRequired} mm</strong> → <strong>${s.length} mm</strong>
            </li>`;
    });
    resultsHtml += '</ul>';
    $results.html(resultsHtml);
}


$zaslepkaInput.on('input', () => { updateValues(); filtruj_modele(); });
$izolacjaInput.on('input', () => { updateValues(); filtruj_modele(); });
$klejInput.on('input', () => { updateValues(); filtruj_modele(); });
$podlozeSelect.on('change', filtruj_modele);
$izolacjaTypSelect.on('change', filtruj_modele);

// Button
$(document).ready(() => {
    $('.suggest_step').on('click', filtruj_modele);
    updateValues();
    filtruj_modele();
});