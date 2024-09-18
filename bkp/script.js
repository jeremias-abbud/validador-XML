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
                globalBeneficiaryNames = getBeneficiaryNames(xmlDoc); // Atualiza a lista global de beneficiários
                displayBeneficiaryInfo(globalBeneficiaryNames);
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
    const tagsToCheck = [
        "guiaSP_SADT", "guiaSP-SADT",
        "guiaResumoInternacao", "guiaResumo-Internacao",
        "guiaConsulta", "guia-Consulta"
    ];

    const extractNames = (elements) => {
        for (let i = 0; i < elements.length; i++) {
            const nomeBeneficiarioElement = elements[i].getElementsByTagNameNS(namespaces.ans, "nomeBeneficiario")[0];
            if (nomeBeneficiarioElement) {
                beneficiaryNames.push(nomeBeneficiarioElement.textContent);
            }
        }
    };

    tagsToCheck.forEach(tag => {
        const elements = xmlDoc.getElementsByTagNameNS(namespaces.ans, tag);
        extractNames(elements);
    });

    return beneficiaryNames;
}

function displayBeneficiaryInfo(beneficiaryNames) {
    const output = document.getElementById('output');
    
    output.innerHTML = `<h4>Resultado - O arquivo possui ${beneficiaryNames.length} contas:<br><br></h4>`;
    beneficiaryNames.forEach((name, index) => {
        output.innerHTML += `<p>Conta ${index + 1}: ${name}</p>`;
    });
    
    // Exibir o botão Limpar após exibir os beneficiários
    const clearBeneficiaryBtn = document.getElementById('clearBeneficiaryBtn');
    clearBeneficiaryBtn.classList.remove('hidden');
}

function exibirBeneficiarios() {
    if (globalBeneficiaryNames.length > 0) {
        displayBeneficiaryInfo(globalBeneficiaryNames);
    } else {
        alert('Nenhum beneficiário disponível para exibir. Por favor, carregue um arquivo XML.');
    }
}

function clearBeneficiaryList() {
    const output = document.getElementById('output');
    output.innerHTML = "";
    
    // Esconde o botão após limpar
    const clearBeneficiaryBtn = document.getElementById('clearBeneficiaryBtn');
    clearBeneficiaryBtn.classList.add('hidden');
}

function validateTag() {
    clearFeedback();
    const tagName = document.getElementById('tagNameInput').value.trim();
    const feedback = document.getElementById('tag-feedback');
    const validationResult = document.getElementById('validationResult');
    const clearResultBtn = document.getElementById('clearResultBtn');

    // Limpa qualquer mensagem de feedback antes de prosseguir
    feedback.classList.add('hidden');
    feedback.textContent = "";

    if (tagName === "") {
        feedback.classList.remove('hidden');
        feedback.textContent = "Por favor, digite o nome da TAG.";
        alert(feedback.textContent);
        return;
    }

    const file = document.getElementById('xmlFileInput').files[0];
    if (!file) {
        feedback.classList.remove('hidden');
        feedback.textContent = "Por favor, selecione um arquivo XML primeiro.";
        return; // Sai da função se nenhum arquivo XML estiver carregado
    }

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
}

function validateTagPresence(xmlDoc, beneficiaryNames, tagName) {
    const namespaces = {
        ans: "http://www.ans.gov.br/padroes/tiss/schemas"
    };

    const tagsToCheck = [
        "guiaSP_SADT", "guiaSP-SADT",
        "guiaResumoInternacao", "guiaResumo-Internacao",
        "guiaConsulta", "guia-Consulta"
    ];

    const results = [];

    const checkTagPresence = (elements, offset) => {
        for (let i = 0; i < elements.length; i++) {
            const tags = elements[i].getElementsByTagNameNS(namespaces.ans, tagName);
            const isPresent = tags.length > 0;
            results.push({ name: beneficiaryNames[i + offset], isPresent });
        }
    };

    let offset = 0;
    tagsToCheck.forEach(tag => {
        const elements = xmlDoc.getElementsByTagNameNS(namespaces.ans, tag);
        checkTagPresence(elements, offset);
        offset += elements.length;
    });

    return results;
}

function displayValidationResult(results) {
    const tagName = document.getElementById('tagNameInput').value.trim();
    const validationResult = document.getElementById('validationResult');
    let index = 0;
    validationResult.innerHTML = `<h4>Resultado - Situação da TAG: "${tagName}" nas contas:<br><br></h4>`;
    results.forEach(result => {
        index++;
        const status = result.isPresent ? "<span class='green-text'>TAG Presente</span>" : "<span class='red-text'>TAG Ausente</span>";
        validationResult.innerHTML += `<p>Conta ${index}: ${result.name} - ${status}</p>`;
    });
}

function compareFiles() {
    const files = document.getElementById('xmlFilesInput').files;
    const feedback = document.getElementById('compare-feedback');
    const resultContainer = document.getElementById('compare-result');

    if (files.length < 2) {
        feedback.textContent = "Por favor, selecione pelo menos dois arquivos XML para comparar.";
        feedback.classList.remove('hidden');
        return;
    }

    const readers = [];
    for (let i = 0; i < files.length; i++) {
        readers.push(readXMLFile(files[i]));
    }

    Promise.all(readers).then(xmlDocs => {
        const tagsByFile = xmlDocs.map(getTagsFromXML);

        const allTags = new Set();
        tagsByFile.forEach(tags => {
            tags.forEach(tag => allTags.add(tag));
        });

        const comparisonResult = compareTagsAcrossFiles(allTags, tagsByFile);
        displayComparisonResult(comparisonResult, files);
    }).catch(error => {
        feedback.textContent = `Erro ao processar os arquivos: ${error.message}`;
        feedback.classList.remove('hidden');
    });
}

function readXMLFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                resolve(xmlDoc);
            } else {
                reject(new Error("Arquivo XML inválido."));
            }
        };
        reader.readAsText(file);
    });
}

function getTagsFromXML(xmlDoc) {
    const tags = new Set();
    const allElements = xmlDoc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        tags.add(allElements[i].localName);
    }
    return tags;
}

function compareTagsAcrossFiles(allTags, tagsByFile) {
    const comparison = {};
    allTags.forEach(tag => {
        comparison[tag] = tagsByFile.map(tags => tags.has(tag));
    });
    return comparison;
}

function displayComparisonResult(comparison, files) {
    const resultContainer = document.getElementById('compare-result');
    resultContainer.innerHTML = '<h4>Resultado da Comparação</h4>';
    for (const tag in comparison) {
        const tagStatus = comparison[tag].map((isPresent, index) => isPresent ? `${files[index].name}: <span class='green-text'>Presente</span>` : `${files[index].name}: <span class='red-text'>Ausente</span>`).join('<br>');
        resultContainer.innerHTML += `<p><strong>${tag}</strong><br>${tagStatus}</p>`;
    }
    resultContainer.classList.remove('hidden');
}

function clearComparison() {
    document.getElementById('compare-feedback').textContent = "";
    document.getElementById('compare-feedback').classList.add('hidden');
    document.getElementById('compare-result').innerHTML = "";
    document.getElementById('compare-result').classList.add('hidden');
    document.getElementById('xmlFilesInput').value = "";
}

function clearFile() {
    globalBeneficiaryNames = [];
    clearFeedback();
    document.getElementById('xmlFileInput').value = "";
    document.getElementById('output').innerHTML = "";
    document.getElementById('validationResult').innerHTML = "";
    document.getElementById('comparisonResult').innerHTML = "";
    document.getElementById('file-feedback').innerHTML = "";
    document.getElementById('tag-feedback').innerHTML = "";
    document.getElementById('comparison-feedback').innerHTML = "";
    document.getElementById('clearResultBtn').classList.add('hidden');
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

function showSection(sectionId) {
    // Verifica se a seção atual é a seção do arquivo XML
    const isFileSection = sectionId === 'file-section';

    // Esconde todas as seções, exceto a seção do arquivo XML se ela estiver sendo exibida
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (!(isFileSection && section.id === 'file-section')) {
            section.classList.add('hidden');
        }
    });

    // Mostra a seção correspondente ao botão clicado
    const activeSection = document.getElementById(sectionId);
    activeSection.classList.remove('hidden');
}

function compararContas() {
    clearFeedback();
    const file = document.getElementById('xmlFileInput').files[0];
    const feedback = document.getElementById('comparison-feedback');
    const validationResult = document.getElementById('comparisonResult');
    const clearResultBtn = document.getElementById('clearResultBtn');

    if (file) {
        validationResult.classList.remove('hidden');
        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlDoc = parseXML(e.target.result);
            if (isValidXML(xmlDoc)) {
                const beneficiaryNames = getBeneficiaryNames(xmlDoc);

                // Mapear as tags presentes em cada conta
                const tagsByBeneficiary = new Map();
                beneficiaryNames.forEach((name, index) => {
                    const tags = xmlDoc.evaluate(`//*[local-name()='guiaSP_SADT' or local-name()='guiaSP-SADT' or local-name()='guiaResumoInternacao' or local-name()='guiaResumo-Internacao' or local-name()='guiaConsulta' or local-name()='guia-Consulta'][${index + 1}]//*[not(self::text())]`, xmlDoc, null, XPathResult.ANY_TYPE, null);
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
                validationResult.innerHTML = "<h4><b>Resultado - Comparação entre TAGS nas contas:</b></h4>";
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
                feedback.classList.remove('hidden');
            }
        };
        reader.readAsText(file);
    } else {
        feedback.classList.remove('hidden');
        feedback.textContent = "Por favor, selecione um arquivo XML primeiro.";
    }
}
