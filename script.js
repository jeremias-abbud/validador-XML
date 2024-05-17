function parseXML(xml) {
    const parser = new DOMParser();
    return parser.parseFromString(xml, "text/xml");
}

function isValidXML(xmlDoc) {
    return !xmlDoc.querySelector("parsererror");
}

function getBeneficiaryNames(xmlDoc) {
    const namespaces = {
        ans: "http://www.ans.gov.br/padroes/tiss/schemas"
    };

    const beneficiaryNames = [];
    const guiaSP_SADT = xmlDoc.getElementsByTagNameNS(namespaces.ans, "guiaSP-SADT");
    const guiaResumoInternacao = xmlDoc.getElementsByTagNameNS(namespaces.ans, "guiaResumoInternacao");

    for (let i = 0; i < guiaSP_SADT.length; i++) {
        const nomeBeneficiario = guiaSP_SADT[i].getElementsByTagNameNS(namespaces.ans, "nomeBeneficiario")[0].textContent;
        beneficiaryNames.push(nomeBeneficiario);
    }

    for (let i = 0; i < guiaResumoInternacao.length; i++) {
        const nomeBeneficiario = guiaResumoInternacao[i].getElementsByTagNameNS(namespaces.ans, "nomeBeneficiario")[0].textContent;
        beneficiaryNames.push(nomeBeneficiario);
    }

    return beneficiaryNames;
}

document.getElementById('xmlFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const xmlDoc = parseXML(e.target.result);
            const feedback = document.getElementById('feedback');
            if (isValidXML(xmlDoc)) {
                feedback.textContent = "Arquivo XML carregado com sucesso.";
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                displayBeneficiaryInfo(beneficiaryNames);
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
            }
        };
        reader.readAsText(file);
    }
});

function displayBeneficiaryInfo(beneficiaryNames) {
    const output = document.getElementById('output');
    output.innerHTML = `<p>O arquivo possui ${beneficiaryNames.length} contas.</p>`;
    beneficiaryNames.forEach((name, index) => {
        output.innerHTML += `<p>Conta ${index + 1}: ${name}</p>`;
    });
}

function validateTag() {
    const tagName = document.getElementById('tagNameInput').value.trim();
    const feedback = document.getElementById('feedback');
    const validationResult = document.getElementById('validationResult');
    const historyContent = document.getElementById('historyContent');
    const clearResultBtn = document.getElementById('clearResultBtn');
    const historyBtn = document.getElementById('historyBtn');

    if (tagName === "") {
        feedback.textContent = "Por favor, digite o nome da TAG.";
        return;
    }

    const file = document.getElementById('xmlFileInput').files[0];
    if (file) {
        feedback.textContent = "Validando TAG...";
        const reader = new FileReader();
        reader.onload = function(e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                const absentAccounts = [];
                beneficiaryNames.forEach((name, index) => {
                    const conta = xmlDoc.evaluate(`//*[local-name()='guiaSP-SADT' or local-name()='guiaResumoInternacao'][${index + 1}]//*[local-name()='${tagName}']`, xmlDoc, null, XPathResult.ANY_TYPE, null);
                    if (!conta.iterateNext()) {
                        absentAccounts.push(name);
                    }
                });

                if (absentAccounts.length > 0) {
                    validationResult.innerHTML = `<p>Tag <span class="bold">${tagName}</span> ausente nas seguintes contas:</p>`;
                    absentAccounts.forEach(name => {
                        validationResult.innerHTML += `<p>${name}</p>`;
                    });
                } else {
                    validationResult.innerHTML = `<p>A tag <span class="bold">${tagName}</span> está presente em todas as contas.</p>`;
                }

                feedback.textContent = "";
                clearResultBtn.classList.remove('hidden');
                historyBtn.classList.remove('hidden'); // Remover classe hidden do botão de histórico
                historyContent.innerHTML += `<div><strong>Validação:</strong> ${tagName} - ${new Date().toLocaleString()}</div>`;
                historyContent.innerHTML += validationResult.innerHTML;
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
            }
        };
        reader.readAsText(file);
    } else {
        feedback.textContent = "Por favor, selecione um arquivo XML primeiro.";
    }
}

function toggleHistory() {
    const history = document.getElementById('history');
    history.classList.toggle('hidden');
}

function clearFile() {
    document.getElementById('xmlFileInput').value = "";
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('feedback').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
}

function clearResult() {
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('feedback').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
}

function clearTag() {
    document.getElementById('tagNameInput').value = "";
}

function compararContas() {
    const feedback = document.getElementById('feedback');
    const validationResult = document.getElementById('validationResult');
    const historyContent = document.getElementById('historyContent');
    const clearResultBtn = document.getElementById('clearResultBtn');

    const file = document.getElementById('xmlFileInput').files[0];
    if (file) {
        feedback.textContent = "Comparando contas...";
        const reader = new FileReader();
        reader.onload = function(e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                const tags = new Set();
                const tagsPorConta = {};

                beneficiaryNames.forEach((name, index) => {
                    const conta = xmlDoc.evaluate(`//*[local-name()='guiaSP-SADT' or local-name()='guiaResumoInternacao'][${index + 1}]/*`, xmlDoc, null, XPathResult.ANY_TYPE, null);
                    tagsPorConta[name] = new Set();
                    let tag = conta.iterateNext();
                    while (tag) {
                        tags.add(tag.localName);
                        tagsPorConta[name].add(tag.localName);
                        tag = conta.iterateNext();
                    }
                });

                validationResult.innerHTML = "<p>Listagem de todas as TAGS das contas:</p>";
                tags.forEach(tag => {
                    let todasContas = true;
                    validationResult.innerHTML += `<p><strong>${tag}</strong>: `;
                    for (const [conta, tagsConta] of Object.entries(tagsPorConta)) {
                        if (!tagsConta.has(tag)) {
                            todasContas = false;
                            validationResult.innerHTML += ` - Não encontrada em ${conta}`;
                        }
                    }
                    if (todasContas) {
                        validationResult.innerHTML += " - Presente em todas as contas";
                    }
                    validationResult.innerHTML += "</p>";
                });

                feedback.textContent = "";
                clearResultBtn.classList.remove('hidden');
                historyContent.innerHTML += `<div><strong>Comparação de contas</strong> - ${new Date().toLocaleString()}</div>`;
                historyContent.innerHTML += validationResult.innerHTML;
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
            }
        };
        reader.readAsText(file);
    } else {
        feedback.textContent = "Por favor, selecione um arquivo XML primeiro.";
    }
}

function listarTagsPadrao() {
    const file = document.getElementById('xmlFileInput').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                const tagsPadrao = new Set();
                const guias = xmlDoc.querySelectorAll('guiaSP-SADT, guiaResumoInternacao');
                guias.forEach(guia => {
                    guia.querySelectorAll('*').forEach(tag => {
                        tagsPadrao.add(tag.nodeName);
                    });
                });

                const output = document.getElementById('output');
                output.innerHTML = "<h2>Listagem das TAGs padrão do arquivo:</h2>";
                tagsPadrao.forEach(tag => {
                    output.innerHTML += `<p><strong>${tag}:</strong> Presente em todas as contas</p>`;
                });

                const absentTags = new Set();
                guias.forEach((guia, index) => {
                    tagsPadrao.forEach(tag => {
                        if (!guia.querySelector(tag)) {
                            absentTags.add(tag);
                        }
                    });
                });

                if (absentTags.size > 0) {
                    output.innerHTML += "<h3>Tags ausentes em alguma conta:</h3>";
                    absentTags.forEach(tag => {
                        output.innerHTML += `<p><strong>${tag}:</strong> Ausente em uma ou mais contas</p>`;
                    });
                }
            } else {
                document.getElementById('feedback').textContent = "Erro: Arquivo XML inválido.";
            }
        };
        reader.readAsText(file);
    } else {
        document.getElementById('feedback').textContent = "Por favor, selecione um arquivo XML primeiro.";
    }
}
