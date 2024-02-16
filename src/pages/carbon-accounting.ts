import { fetchJSON } from '$utils/fetchJSON';
import { floatStringToInteger } from '$utils/floatToInteger';
import { getProjectIDFromURL } from '$utils/getProjectIDFromURL';
import { timestampToDate } from '$utils/timestampToDate';
import { initAlpine } from '$utils/webflowAlpine';

window.addEventListener('alpine:init', function () {
  alpineModules();
});

// import and initialize AlpineJS
window.Webflow.push(() => {
  initAlpine();
});

// Reactive data using AlpineJS modules
function alpineModules() {
  // Registry module
  window.Alpine.data('carbonAccountingRegistry', () => ({
    retired: '0',
    accumulated: '0',

    async init() {
      const projectID = getProjectIDFromURL();
      let query;

      try {
        query = await fetchJSON(
          `https://offset-service.greenstory.ca/api/v1/offset/project/${projectID}?content=full&lang_code=en`
        );
      } catch (e) {
        console.error('Error in querying for registry data', e);
        return;
      }

      const retiredNumberString = query.project_metric_configs[0].project_registry_balances[0].issued;
      const accumulatedNumberString = query.project_metric_configs[0].project_registry_balances[0].retired;

      this.retired = floatStringToInteger(retiredNumberString);
      this.accumulated = floatStringToInteger(accumulatedNumberString);
    },
  }));

  // Transactions common table
  window.Alpine.data('transactionsLog', () => ({
    projectID: getProjectIDFromURL(),
    type: undefined, // `retiral` or `transactions`
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
        return `${this.rowIndex}_${this.id}`;
      },
    },

    async init() {
      await this.$nextTick(); // wait to process `x-init` data attribute to set the `registryType`

      if (!this.type) {
        console.error(
          'No type set on the `transactionsLog` module. Initialize it as either "retiral" or "transactions"'
        );
        return;
      }

      await this.fetchData();
    },

    async fetchData() {
      // transaction endpoints
      const dataEndpoint = {
        retiral: `https://offset-service.greenstory.ca/api/v1/offset/project/${this.projectID}/issuance?page=${this.page}&limit=${this.rowCount}`,
        transactions: `https://offset-service.greenstory.ca/api/v1/offset/retiral?project_id=${this.projectID}&page=${this.page}&limit=${this.rowCount}`,
      };

      this.isLoading = true;
      this.isError = false;

      let data;

      try {
        data = await fetchJSON(dataEndpoint[this.type]);
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
        if ('retiral' === this.type) {
          data.result.forEach((item) => {
            const transaction = {
              id: item.id,
              date: timestampToDate(parseInt(item.project_issuance.issuance_time)),
              quantity: floatStringToInteger(item.value),
              transactionID: item.transaction_guid,
              documentURL: item.project_issuance.certificate,
            };
            this.transactionData.push(transaction);
          });
        } else {
          // `transactions` type
          data.result.forEach((item) => {
            const transaction = {
              id: item.id,
              date: timestampToDate(
                parseInt(item.project_retiral.retiral_time) * 1000 // convert to milliseconds
              ),
              quantity: parseFloat(item.value).toLocaleString('en-US', {
                maximumFractionDigits: 3,
              }),
              transactionID: item.transaction_guid,
            };
            this.transactionData.push(transaction);
          });
        }
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
}
