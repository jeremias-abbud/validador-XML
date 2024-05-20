let globalBeneficiaryNames = []; // Variável global para armazenar os nomes dos beneficiários

document.getElementById('xmlFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlDoc = parseXML(e.target.result);
            const feedback = document.getElementById('file-feedback');
            if (isValidXML(xmlDoc)) {
                feedback.textContent = "Arquivo XML carregado com sucesso.";
                feedback.classList.add('success');
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                displayBeneficiaryInfo(beneficiaryNames);
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
                feedback.classList.remove('success');
                feedback.classList.add('error');
            }
        };
        reader.readAsText(file);
    }
});

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
    const guiaConsulta = xmlDoc.getElementsByTagNameNS(namespaces.ans, "guiaConsulta");

    for (let i = 0; i < guiaSP_SADT.length; i++) {
        const nomeBeneficiario = guiaSP_SADT[i].getElementsByTagNameNS(namespaces.ans, "nomeBeneficiario")[0].textContent;
        beneficiaryNames.push(nomeBeneficiario);
    }

    for (let i = 0; i < guiaResumoInternacao.length; i++) {
        const nomeBeneficiario = guiaResumoInternacao[i].getElementsByTagNameNS(namespaces.ans, "nomeBeneficiario")[0].textContent;
        beneficiaryNames.push(nomeBeneficiario);
    }

    for (let i = 0; i < guiaConsulta.length; i++) {
        const nomeBeneficiario = guiaConsulta[i].getElementsByTagNameNS(namespaces.ans, "nomeBeneficiario")[0].textContent;
        beneficiaryNames.push(nomeBeneficiario);
    }

    return beneficiaryNames;
}

function displayBeneficiaryInfo(beneficiaryNames) {
    const output = document.getElementById('output');
    output.innerHTML = `<p>O arquivo possui ${beneficiaryNames.length} contas.</p>`;
    globalBeneficiaryNames = beneficiaryNames; // Atribui os nomes dos beneficiários à variável global
    beneficiaryNames.forEach((name, index) => {
        output.innerHTML += `<p>Conta ${index + 1}: ${name}</p>`;
    });
    // Remover a classe 'hidden' do botão Limpar Resultado
    document.getElementById('clearResultBtn').classList.remove('hidden');
}

function exibirBeneficiarios() {
    displayBeneficiaryInfo(globalBeneficiaryNames); // Usando a variável global que armazena os nomes dos beneficiários
}

function validateTag() {
    clearFeedback();
    const tagName = document.getElementById('tagNameInput').value.trim();
    const feedback = document.getElementById('tag-feedback');
    const validationResult = document.getElementById('validationResult');
    const clearResultBtn = document.getElementById('clearResultBtn');

    if (tagName === "") {
        feedback.textContent = "Por favor, digite o nome da TAG.";
        return;
    }

    const file = document.getElementById('xmlFileInput').files[0];
    if (file) {
        feedback.textContent = `Validando TAG ${tagName}...`;
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                const result = validateTagPresence(xmlDoc, beneficiaryNames, tagName);
                displayValidationResult(result);
                clearResultBtn.classList.remove('hidden');
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
            }
        };
        reader.readAsText(file);
    } else {
        feedback.textContent = "Por favor, selecione um arquivo XML primeiro.";
    }
}

function validateTagPresence(xmlDoc, beneficiaryNames, tagName) {
    const namespaces = {
        ans: "http://www.ans.gov.br/padroes/tiss/schemas"
    };

    const guiaSP_SADT = xmlDoc.getElementsByTagNameNS(namespaces.ans, "guiaSP-SADT");
    const guiaResumoInternacao = xmlDoc.getElementsByTagNameNS(namespaces.ans, "guiaResumoInternacao");
    const guiaConsulta = xmlDoc.getElementsByTagNameNS(namespaces.ans, "guiaConsulta");

    const results = [];

    for (let i = 0; i < guiaSP_SADT.length; i++) {
        const tags = guiaSP_SADT[i].getElementsByTagNameNS(namespaces.ans, tagName);
        const isPresent = tags.length > 0;
        results.push({ name: beneficiaryNames[i], isPresent });
    }

    for (let i = 0; i < guiaResumoInternacao.length; i++) {
        const tags = guiaResumoInternacao[i].getElementsByTagNameNS(namespaces.ans, tagName);
        const isPresent = tags.length > 0;
        results.push({ name: beneficiaryNames[i + guiaSP_SADT.length], isPresent });
    }

    for (let i = 0; i < guiaConsulta.length; i++) {
        const tags = guiaConsulta[i].getElementsByTagNameNS(namespaces.ans, tagName);
        const isPresent = tags.length > 0;
        results.push({ name: beneficiaryNames[i + guiaSP_SADT.length + guiaResumoInternacao.length], isPresent });
    }

    return results;
}

function displayValidationResult(results) {
    const tagName = document.getElementById('tagNameInput').value.trim();
    const validationResult = document.getElementById('validationResult');
    validationResult.innerHTML = `<h3>Resultado da Validação por TAG: ${tagName}</h3>`;
    results.forEach(result => {
        const status = result.isPresent ? "<span class='green-text'>Presente</span>" : "<span class='red-text'>Ausente</span>";
        validationResult.innerHTML += `<p>Beneficiário: ${result.name} - TAG ${status}</p>`;
    });
}

function compararContas() {
    clearFeedback();
    const file = document.getElementById('xmlFileInput').files[0];
    const feedback = document.getElementById('comparison-feedback');
    const validationResult = document.getElementById('comparisonResult');
    const clearResultBtn = document.getElementById('clearResultBtn');

    if (file) {
        feedback.textContent = "Comparando contas...";
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlDoc = new DOMParser().parseFromString(e.target.result, "text/xml");
            if (xmlDoc.getElementsByTagName('parsererror').length === 0) {
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);

                // Mapear as tags presentes em cada conta
                const tagsByBeneficiary = new Map();
                beneficiaryNames.forEach((name, index) => {
                    const tags = xmlDoc.evaluate(`//*[local-name()='guiaSP-SADT' or local-name()='guiaResumoInternacao' or local-name()='guiaConsulta'][${index + 1}]//*[not(self::text())]`, xmlDoc, null, XPathResult.ANY_TYPE, null);
                    let tag = tags.iterateNext();
                    const tagList = [];
                    while (tag) {
                        tagList.push(tag.localName);
                        tag = tags.iterateNext();
                    }
                    tagsByBeneficiary.set(name, tagList);
                });

                // Verificar quais tags estão presentes em todas as contas
                const allTags = new Set();
                tagsByBeneficiary.forEach(tagList => {
                    tagList.forEach(tag => allTags.add(tag));
                });

                // Listar todas as tags e verificar a presença em cada conta
                validationResult.innerHTML = "<h3><b>Listagem de todas as TAGS das contas:</b></h3>";
                allTags.forEach(tagName => {
                    const accountsMissingTag = [];
                    tagsByBeneficiary.forEach((tagList, beneficiaryName) => {
                        if (!tagList.includes(tagName)) {
                            accountsMissingTag.push(beneficiaryName);
                        }
                    });
                    const status = accountsMissingTag.length === 0 ? "Presente em todas as contas" : `Não encontrada em ${accountsMissingTag.join(", ")}`;
                    const resultElement = document.createElement('p');
                    resultElement.innerHTML = `<strong>${tagName}</strong>: ${status}`;
                    if (accountsMissingTag.length === 0) {
                        resultElement.classList.add('present');
                    } else {
                        resultElement.classList.add('absent');
                    }
                    validationResult.appendChild(resultElement);
                });

                // Atualizar interface de usuário
                clearResultBtn.classList.remove('hidden');
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
            }
        };
        reader.readAsText(file);
    } else {
        feedback.textContent = "Por favor, selecione um arquivo XML primeiro.";
    }
}

function clearComparisonSection() {
    document.getElementById('comparison-feedback').innerHTML = "";
    document.getElementById('comparison-feedback').classList.remove('success', 'error');
    document.getElementById('comparisonResult').innerHTML = "";
}

function clearBeneficiaryList() {
    const output = document.getElementById('output');
    output.innerHTML = "";
}

function clearFile() {
    clearFeedback();
    document.getElementById('xmlFileInput').value = "";
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('comparisonResult').innerHTML = "";
    document.getElementById('file-feedback').innerHTML = "";
    document.getElementById('tag-feedback').innerHTML = "";
    document.getElementById('comparison-feedback').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
    globalBeneficiaryNames = []; // Limpa a variável global que armazena os nomes dos beneficiários
}

function clearResult() {
    clearFeedback();
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('comparisonResult').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
}

function clearTag() {
    document.getElementById('tagNameInput').value = "";
}

function clearTagSection() {
    document.getElementById('tagNameInput').value = "";
    document.getElementById('tag-feedback').innerHTML = "";
    document.getElementById('tag-feedback').classList.remove('success', 'error');
    document.getElementById('validationResult').innerHTML = "";
}

function clearFeedback() {
    const feedbackElements = document.querySelectorAll('.result');
    feedbackElements.forEach(feedback => {
        feedback.textContent = "";
        feedback.classList.remove('success');
        feedback.classList.remove('error');
    });
}
