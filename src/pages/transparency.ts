import { fetchJSON } from '$utils/fetchJSON';
import { floatStringToInteger } from '$utils/floatToInteger';
import { initAlpine } from '$utils/webflowAlpine';

// import and initialize AlpineJS
initAlpine();

// Reactive data using AlpineJS modules
window.addEventListener('alpine:init', function () {
  const SHARED_VALUE_STORE_NAME = 'sharedValue';

  // Shared data value store
  window.Alpine.store(SHARED_VALUE_STORE_NAME, {
    carbonRetiredCount: 0,
    treeRegistryCount: 0,
  });

  // Card Proof module
  window.Alpine.data('cardProofNumbers', () => ({
    async init() {
      let query;

      try {
        query = await fetchJSON('https://offset-service.greenstory.ca/api/v1/offset/summary?measures=offset_value');
      } catch (e) {
        return;
      }

      const carbonNumberString = query[0]?.summary_by_metric.filter((obj) => {
        return obj.metric_id === 2;
      })[0].offset;
      if (carbonNumberString) {
        window.Alpine.store(SHARED_VALUE_STORE_NAME).carbonRetiredCount = floatStringToInteger(carbonNumberString);
      }

      const treesNumberString = query[0]?.summary_by_metric.filter((obj) => {
        return obj.metric_id === 20;
      })[0].offset;
      if (treesNumberString) {
        window.Alpine.store(SHARED_VALUE_STORE_NAME).treeRegistryCount = floatStringToInteger(treesNumberString);
      }
    },
  }));

  // Search module
  window.Alpine.data('searchTransaction', () => ({
    searchInput: '',
    submitButtonText: undefined,
    isLoading: false,
    isError: false,

    async search() {
      this.isError = false;
      this.isLoading = true;

      let data;

      try {
        data = await fetchJSON(
          `https://offset-service.greenstory.ca/api/v1/offset/retiral/projects/metrics?page=1&limit=1&transaction_guid=${this.searchInput}`
        );
      } catch (e) {
        this.isLoading = false;
        this.isError = true;
        return;
      }

      this.isLoading = false;

      if (!data) {
        this.isError = true;
        return;
      }

      // https://simplizero.com/order-detail-page/?ext_order_id=320-291609&store_domain=x79kxz20uq&lang_code=en&utm_medium=email

      let externalURL = new URL('https://simplizero.com/order-detail-page/?lang_code=en&utm_medium=email');

      const extOrderID = data.result[0]?.project_retiral?.ext_order_id;
      const storeDomain = data.result[0]?.project_retiral?.store_domain;

      if (!extOrderID || !storeDomain) {
        this.isError = true;
        return;
      }

      externalURL.searchParams.append('ext_order_id', extOrderID);
      externalURL.searchParams.append('store_domain', storeDomain);

      // Triggering opening the URL in a new tab
      const anchor = document.createElement('a');
      anchor.href = externalURL.href;
      anchor.target = '_blank';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();

      anchor.remove();

      this.searchInput = '';
    },
  }));

  // Carbon Registry Issued and Retired stats
  window.Alpine.data('carbonRegistryStats', () => ({
    issued: '.........',

    async init() {
      let issuedCount = 0;
      let retiredCount = 0;
      let issuedStatQuery;

      try {
        issuedStatQuery = await fetchJSON('https://offset-service.greenstory.ca/api/v1/offset/project');
      } catch (e) {
        return;
      }

      if (issuedStatQuery.length) {
        try {
          issuedStatQuery.forEach((project) => {
            const issuedString = project.project_metric_configs[0]?.project_registry_balances[0]?.issued;
            if (issuedString) {
              issuedCount += parseInt(issuedString);
            }
          });
        } catch (e) {
          console.error(e);
          return;
        }
      }

      this.issued = floatStringToInteger(issuedCount);
    },
  }));

  // Registry transactions - Both Carbon and Trees
  window.Alpine.data('registryTransactions', () => ({
    registryType: undefined, // `carbonTransactions` || `carbonPurchases` || `trees`
    page: 1,
    rowCount: 5, // transaction limit to show at once
    transactionData: [],
    transactionRows: [], // only used for `carbonPurchases` since all `transactionData` loads at once
    buttonText: 'See more',
    isLoading: true,
    loadingText: 'Loading...',
    isError: false,
    areTransactionsAvailable: true,

    transactionRow: {
      [':key']() {
        return `${this.rowIndex}_${this.transaction.id}`;
      },
    },

    async init() {
      await this.$nextTick(); // wait to process `x-init` data attribute to set the `registryType`

      if (!this.registryType) {
        console.error('No registry type set on the `registryTransactions` module');
        return;
      }

      await this.fetchData();
    },

    async fetchData() {
      // Carbon registry endpoint
      const dataEndpoint = {
        carbonTransactions: `https://offset-service.greenstory.ca/api/v1/offset/retiral/projects/metrics?page=${this.page}&limit=${this.rowCount}&metric_id=2`,
        carbonPurchases: 'https://offset-service.greenstory.ca/api/v1/offset/project/issuances/all',
        trees: `https://offset-service.greenstory.ca/api/v1/offset/retiral/projects/metrics?page=${this.page}&limit=${this.rowCount}&metric_id=20`,
      };

      this.isLoading = true;
      this.isError = false;

      let data;

      try {
        data = await fetchJSON(dataEndpoint[this.registryType]);
      } catch (e) {
        this.isLoading = false;
        this.isError = true;
        return;
      }

      this.isLoading = false;

      if (!data) {
        this.isError = true;
        return;
      }

      try {
        const result = 'carbonPurchases' === this.registryType ? data : data.result;
        result.forEach((item) => {
          const transactionInfo = {
            id: item.id,
            name: item.project_metric_config.project.name.default.en,
            image: item.project_metric_config.project.image_desktop.url,
            offset_amt:
              'carbonTransactions' === this.registryType ? parseFloat(item.value).toFixed(2) : parseInt(item.value),
            project_id: item.project_metric_config.project_id,
          };

          if ('carbonPurchases' === this.registryType) {
            transactionInfo.certificateUrl = item.project_issuance.certificate;
          }

          this.transactionData.push(transactionInfo);
        });

        if ('carbonPurchases' === this.registryType) {
          // initially showing 5 transactions
          this.showTransactions();
        }
      } catch (e) {
        console.error('Error!: ', e);
        if (this.transactionData.length > 0) {
          this.areTransactionsAvailable = false;
        } else {
          this.isError = true;
        }
        return;
      }
    },

    async loadMore() {
      this.page += 1;
      this.fetchData();
    },

    // function to partially load `transactionData` into `transactionRows` for `carbonPurchases` already loaded data
    showTransactions() {
      const start = this.page * this.rowCount - this.rowCount;
      const end = this.page * this.rowCount - 1;

      try {
        for (let i = start; i <= end; i++) {
          this.transactionRows.push(this.transactionData[i]);
        }
      } catch (e) {
        console.error(e);
        this.areTransactionsAvailable = false;
        return;
      }

      this.page += 1;
    },
  }));

  // Transaction log table
  window.Alpine.data('transactionsLog', () => ({
    page: 1,
    rowCount: 5, // transaction limit to show at once
    transactionData: [],
    buttonText: 'See more',
    isLoading: true,
    loadingText: 'Loading...',
    isError: false,
    areTransactionsAvailable: true,

    transactionRow: {
      [':key']() {
        return this.rowIndex;
      },
    },

    async init() {
      await this.$nextTick(); // wait to process `x-init` data attribute to set the `registryType`
      await this.fetchData();
    },

    async fetchData() {
      // Carbon registry endpoint
      const dataEndpoint = `https://store-sync-service.greenstory.ca/api/transactions/logs?page=${this.page}&size=${this.rowCount}&desc=true`;

      this.isLoading = true;
      this.isError = false;

      let data;

      try {
        data = await fetchJSON(dataEndpoint);
      } catch (e) {
        this.isLoading = false;
        this.isError = true;
        return;
      }

      this.isLoading = false;

      if (!data) {
        this.isError = true;
        return;
      }

      try {
        data.forEach((item) => {
          this.transactionData.push({
            name: item.text,
            image: item.project.asset,
            last_updated: item.status.text,
            offset_type: item.contribution.type,
            offset_amt: {
              value: item.offset.value,
              unit: item.offset.unit,
            },
            contributed_to: item.project.name,
          });
        });
      } catch (e) {
        console.error(e);
        if (this.transactionData.length > 0) {
          this.areTransactionsAvailable = false;
        } else {
          this.isError = true;
        }
        return;
      }
    },

    async loadMore() {
      this.page += 1;
      this.fetchData();
    },
  }));
});
