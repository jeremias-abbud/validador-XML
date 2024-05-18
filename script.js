let globalBeneficiaryNames = []; // Variável global para armazenar os nomes dos beneficiários


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

document.getElementById('xmlFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlDoc = parseXML(e.target.result);
            const feedback = document.getElementById('feedback');
            if (isValidXML(xmlDoc)) {
                feedback.textContent = "Arquivo XML carregado com sucesso.";
                feedback.classList.add('success');
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                displayBeneficiaryInfo(beneficiaryNames);
            } else {
                feedback.textContent = "Erro: Arquivo XML inválido.";
                feedback.classList.remove('success');
            }
        };
        reader.readAsText(file);
    }
});

function displayBeneficiaryInfo(beneficiaryNames) {
    const output = document.getElementById('output');
    output.innerHTML = `<p>O arquivo possui ${beneficiaryNames.length} contas.</p>`;
    globalBeneficiaryNames = beneficiaryNames; // Atribui os nomes dos beneficiários à variável global
    beneficiaryNames.forEach((name, index) => {
        output.innerHTML += `<p>Conta ${index + 1}: ${name}</p>`;
        // Remover a classe 'hidden' do botão Limpar Resultado
    document.getElementById('clearResultBtn').classList.remove('hidden');
    });
}


function exibirBeneficiarios() {
    displayBeneficiaryInfo(globalBeneficiaryNames); // Usando a variável global que armazena os nomes dos beneficiários
}


function validateTag() {
    clearFeedback();
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
        reader.onload = function (e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);
                const absentAccounts = [];
                beneficiaryNames.forEach((name, index) => {
                    const conta = xmlDoc.evaluate(`//*[local-name()='guiaSP-SADT' or local-name()='guiaResumoInternacao' or local-name()='guiaConsulta'][${index + 1}]//*[local-name()='${tagName}']`, xmlDoc, null, XPathResult.ANY_TYPE, null);
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
    clearFeedback();
    document.getElementById('xmlFileInput').value = "";
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('feedback').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
    document.getElementById('historyBtn').classList.add('hidden');
}

function clearResult() {
    clearFeedback();
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('feedback').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
    document.getElementById('historyBtn').classList.add('hidden');
}

function clearTag() {
    document.getElementById('tagNameInput').value = "";
}

function compararContas() {
    clearFeedback();
    const feedback = document.getElementById('feedback');
    const validationResult = document.getElementById('validationResult');
    const historyContent = document.getElementById('historyContent');
    const clearResultBtn = document.getElementById('clearResultBtn');
    const historyBtn = document.getElementById('historyBtn');

    const file = document.getElementById('xmlFileInput').files[0];
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
                validationResult.innerHTML = "<p>Listagem de todas as TAGS das contas:</p>";
                allTags.forEach(tagName => {
                    const accountsMissingTag = [];
                    tagsByBeneficiary.forEach((tagList, beneficiaryName) => {
                        if (!tagList.includes(tagName)) {
                            accountsMissingTag.push(beneficiaryName);
                        }
                    });
                    const status = accountsMissingTag.length === 0 ? "Presente em todas as contas" : `Não encontrada em ${accountsMissingTag.join(", ")}`;
                    validationResult.innerHTML += `<p><strong>${tagName}</strong>: ${status}</p>`;
                });

                // Atualizar interface de usuário
                feedback.textContent = "";
                clearResultBtn.classList.remove('hidden');
                historyBtn.classList.remove('hidden');
                historyContent.innerHTML += `<div><strong>Comparação de contas:</strong> ${new Date().toLocaleString()}</div>`;
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

function updateFeedbackMessage(message, isSuccess) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.classList.remove(isSuccess ? 'error' : 'success');
    feedback.classList.add(isSuccess ? 'success' : 'error');
}

function clearFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = "";
    feedback.classList.remove('success');
    feedback.classList.remove('error');
}

