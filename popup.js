populateTabs();

function getTabGroups() {
  const tabGroups = {};

  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        if (!tabGroups.hasOwnProperty(tab.groupId)) {
          tabGroups[tab.groupId] = [];
        }
  
        tabGroups[tab.groupId].push(tab);
      });

      resolve(tabGroups);
    });
  });
};

async function populateTabs() {
  const tabGroups = await getTabGroups();

  for (const groupId in tabGroups) {
    renderData(groupId, tabGroups[groupId]);
  }
};

function renderData(groupId, tabGroup) {
  const container = document.createElement('div');
  container.style.marginBottom = '20px';
  container.style.border = '1px solid #ccc';
  container.style.padding = '10px';

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '10px';
  table.innerHTML = `
    <thead>
      <tr>
        <th style="border: 1px solid #ddd; padding: 8px;">
          Tab Group
          <img
            src="images/download-icon.svg"
            width="15px"
          >
        </th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  const downloadIcon = table.querySelector('thead tr th img');

  downloadIcon.addEventListener("click", () => download(groupId));

  tabGroup.forEach((tab) => {
    const row = document.createElement('tr');
    row.style.border = '1px solid #ddd';
    row.style.padding = '8px';

    row.innerHTML = `
      <td style="border: 1px solid #ddd; padding: 8px;">
        <abbr title="${tab.url}">
          <img src="${tab.favIconUrl}" width="15px">
          ${tab.title}
        </abbr>
      </td>
    `;

    tbody.appendChild(row);
  });

  container.appendChild(table);
  document.body.appendChild(container);
};

async function download(groupId) {
  const { [groupId]: group } = await getTabGroups();

  const transformedGroup = group.map((i) => {
    return { favIconUrl: i.favIconUrl, title: i.title, url: i.url };
  })

  const data = JSON.stringify(transformedGroup, null, 2);

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tab_data.json";
  a.click();

  URL.revokeObjectURL(url);
};

const createTabs = async (tabList) => {
  const tabIds = [];

  for (const tabInfo of tabList) {
    const createdTab = await chrome.tabs.create({ url: tabInfo.url });
    tabIds.push(createdTab.id);
  }

  const groupId = await chrome.tabs.group({ tabIds });

  chrome.tabGroups.update(groupId, {
    collapsed: true,
    title: "importer",
    color: "grey",
  });
};


function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onload = function (e) {
      const tabList = JSON.parse(e.target.result);
  
      resolve(tabList);
    };
  })
}

document.getElementById("openTabsButton").addEventListener("click", async function () {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  const tabList = await readFile(file);

  createTabs(tabList);
});
