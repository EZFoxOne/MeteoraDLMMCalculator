class App {
    constructor() {
        this.databaseManager = new DatabaseManager(this);
        this.modalManager = new ModalManager(this);
        this.notificationManager = new NotificationManager(this);
        this.config = null;

        this.searchInput = document.getElementById('searchInput');
        this.dropdownContent = document.getElementById('dropdown-content');
        this.topProfitablePoolsContainer = document.getElementById('top-profitable-pools-container');
        this.userTVLInput = document.getElementById('user-tvl-input');
        this.minLiquidityInput = document.getElementById('min-liquidity-input');
        this.minVolumeInput = document.getElementById('min-volume-input');
        this.poolDataContainer = document.getElementById('pool-data-container');
        this.poolHealthContainer = document.getElementById('pool-health-container');
        this.isTVLAdded = document.getElementById('tvl-is-added');
        this.percentOfPool = document.getElementById('percent-of-pool');
        this.dailyReturn = document.getElementById('daily-return');
        this.timeToROI = document.getElementById('time-to-roi');

        this.allPoolData = null;
        this.currentPool = null;

        // Bind methods to the class instance
        this.copyTextToClipboard = this.copyTextToClipboard.bind(this);
        this.displayResults = this.displayResults.bind(this);
        this.updatePoolData = this.updatePoolData.bind(this);
    }

    async init() {
        await this.databaseManager.initialize();
        this.config = {
            minLiquidity: 1000,
            minVolume: 1000,
            significantLiquidityThreshold: 5000,
            diversityThreshold: 2
        };
        await this.getAllPools();
        await this.calculateTopProfitablePools();
        await this.setListeners();
        this.notificationManager.startProcessing();
    }

    async refreshPools() {
        const refreshStatus = document.getElementById('refresh-status');
        // refreshStatus.innerText = 'Refreshing pools...';
        await this.getAllPools();
        await this.calculateTopProfitablePools();
        // refreshStatus.innerText = 'Pools refreshed!';
        await this.notificationManager.addNotification('Success', 'Pools refreshed!', 'success', 3000);
    }

    async setListeners() {
        this.searchInput.addEventListener('focus', () => this.displayResults());
        this.searchInput.addEventListener('input', () => this.displayResults());

        document.addEventListener('click', (event) => {
            if (!event.target.matches('#searchInput')) {
                this.dropdownContent.classList.remove('show');
            }
        });
    }

    async getAllPools() {
        const response = await fetch('https://dlmm-api.meteora.ag/pair/all');
        this.allPoolData = await response.json();
    }

    async getPoolBinArrays(poolAddress) {
        const response = await fetch(`https://dlmm-api.meteora.ag/pair/${poolAddress}/bin_arrays`);
        return await response.json();
    }

    calculateTopProfitablePools() {
        console.log("calculating top profitable pools")
        const userTVL = parseFloat(this.userTVLInput.value);
        const minLiquidity = parseFloat(this.minLiquidityInput.value);
        const minVolume = parseFloat(this.minVolumeInput.value);

        if (!userTVL) {
            return;
        }
        const isTVLAdded = document.querySelector("#tvl-is-added").checked;

        const poolProfits = this.allPoolData.map(pool => {
            let effectiveLiquidity = parseFloat(pool.liquidity);
            if (effectiveLiquidity < minLiquidity || pool.trade_volume_24h < minVolume) {
                return {...pool, dailyReturn: 0};
            }
            if (isTVLAdded) {
                effectiveLiquidity += userTVL;
            }
            const dailyReturn = (userTVL / effectiveLiquidity) * parseFloat(pool.fees_24h);
            return {...pool, dailyReturn};
        });

        poolProfits.sort((a, b) => b.dailyReturn - a.dailyReturn);
        const top5Pools = poolProfits.slice(0, 50);

        this.topProfitablePoolsContainer.innerHTML = `
    <h3>Top 50 Most Profitable DLMM Pools</h3>
    <table class="styled-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Liquidity</th>
                <th>24 Hour Fees</th>
                <th>24 Hour Volume</th>
                <th>Daily Return</th>
            </tr>
        </thead>
        <tbody>
            ${top5Pools.map(pool => `
                <tr class="pool-row" data-address="${pool.address}">
                    <td>${pool.name}</td>
                    <td>$${parseFloat(pool.liquidity).toFixed(2)}</td>
                    <td>$${parseFloat(pool.fees_24h).toFixed(2)}</td>
                    <td>$${parseFloat(pool.trade_volume_24h).toFixed(2)}</td>
                    <td>$${pool.dailyReturn.toFixed(2)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;
        document.querySelectorAll('.pool-row').forEach(row => {
            row.addEventListener('click', event => {
                const address = event.currentTarget.getAttribute('data-address');
                this.updatePoolData(null, address);
            });
        });
    }

    estimate() {
        console.log("estimating roi")
        const userTVL = parseFloat(this.userTVLInput.value);
        const minLiquidity = parseFloat(this.minLiquidityInput.value);
        const minVolume = parseFloat(this.minVolumeInput.value);
        if (userTVL > 0) {
            // TODO - switch to databasemanager
            localStorage.setItem('userTVL', userTVL.toString());
            console.log("userTVL", userTVL)
        }
        const isTVLAdded = this.isTVLAdded.checked;
        console.log("isTVLAdded", isTVLAdded)

        if (this.currentPool) {
            let effectiveLiquidity = parseFloat(this.currentPool.liquidity);

            if (isTVLAdded) {
                effectiveLiquidity += userTVL;
            }
            const dailyReturn = (userTVL / effectiveLiquidity) * parseFloat(this.currentPool.fees_24h);
            const timeToROI = (userTVL / dailyReturn)
            console.log("timeToROI", timeToROI)
            const percentOfPool = ((userTVL / effectiveLiquidity) * 100)
            this.percentOfPool.innerText = `${percentOfPool.toFixed(2)}%`;
            this.dailyReturn.innerText = `$${dailyReturn.toFixed(2)}`;
            this.timeToROI.innerText = `${timeToROI.toFixed(2)} Days`;
        }
        this.calculateTopProfitablePools(this.allPoolData);
        this.getPoolBinArrays(this.currentPool.address).then(binArrays => {console.log(binArrays)});
        // this.analyzePoolHealth(this.currentPool).then(healthMetrics => this.displayPoolHealth(this.currentPool, healthMetrics));
    }

    // displayResults() {
    //     const query = this.searchInput.value.toLowerCase();
    //     const minLiquidity = parseFloat(this.minLiquidityInput.value);
    //     const minVolume = parseFloat(this.minVolumeInput.value);
    //
    //     this.dropdownContent.innerHTML = '';
    //     if (query || document.activeElement === this.searchInput) {
    //         const results = this.allPoolData
    //             .filter(item => item.name.toLowerCase().includes(query) && item.liquidity >= minLiquidity && item.trade_volume_24h >= minVolume)
    //             .sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity));
    //         results.forEach((item, iter) => {
    //             const a = document.createElement('a');
    //             a.href = '#';
    //             a.textContent = `${iter+1}) ${item.name} (Liquidity: $${parseFloat(item.liquidity).toFixed(2)})`;
    //             a.addEventListener('click', (e) => {
    //                 e.preventDefault();
    //                 this.searchInput.value = item.name;
    //                 this.updatePoolData(item);
    //                 this.dropdownContent.classList.remove('show');
    //             });
    //             this.dropdownContent.appendChild(a);
    //         });
    //         this.dropdownContent.classList.add('show');
    //     } else {
    //         this.dropdownContent.classList.remove('show');
    //     }
    // }

    displayResults() {
        const query = this.searchInput.value.toLowerCase();
        const minLiquidity = parseFloat(this.minLiquidityInput.value);
        const minVolume = parseFloat(this.minVolumeInput.value);

        this.dropdownContent.innerHTML = '';
        if (query || document.activeElement === this.searchInput) {
            const results = this.allPoolData
                .filter(item =>
                    (item.name.toLowerCase().includes(query) || item.address.toLowerCase().includes(query)) &&
                    item.liquidity >= minLiquidity &&
                    item.trade_volume_24h >= minVolume
                )
                .sort((a, b) => parseFloat(b.liquidity) - parseFloat(a.liquidity));

            results.forEach((item, iter) => {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = `${iter + 1}) ${item.name} (Liquidity: $${parseFloat(item.liquidity).toFixed(2)})`;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.searchInput.value = item.name;
                    this.updatePoolData(item);
                    this.dropdownContent.classList.remove('show');
                });
                this.dropdownContent.appendChild(a);
            });
            this.dropdownContent.classList.add('show');
        } else {
            this.dropdownContent.classList.remove('show');
        }
    }

    displayPoolData() {
        this.poolDataContainer.innerHTML = `
        <div class="pool-data-title">${this.currentPool.name}</div>
        <div class="pool-address" onclick="app.copyTextToClipboard('${this.currentPool.address}')">${this.currentPool.address}</div>
        <div id="pool-links-container" class="pool-links-container">
            <span class="pool-link-icon meteora-icon" onclick="window.open('https://app.meteora.ag/dlmm/${this.currentPool.address}')">Meteora</span>
            <span class="pool-link-icon birdeye-icon" onclick="window.open('https://birdeye.so/token/${this.currentPool.mint_x}/${this.currentPool.address}')">Birdeye</span>
            <span class="pool-link-icon jupiter-icon" onclick="window.open('https://jup.ag/swap/${this.currentPool.mint_x}-${this.currentPool.mint_y}')">Jupiter</span>
            <span class="pool-link-icon solscan-icon" onclick="window.open('https://solscan.io/account/${this.currentPool.address}')">SolScan</span>
        </div>
        <div class="pool-data-wrapper">
        <table>
            <tbody>
                <tr>
                    <td class="pool-item-label">Bin Step</td>
                    <td class="pool-item-value">${this.currentPool.bin_step}</td>
                </tr>
                <tr>
                    <td class="pool-item-label">Base Fee Percentage</td>
                    <td class="pool-item-value">${this.currentPool.base_fee_percentage}%</td>
                </tr>
                <tr>
                    <td class="pool-item-label">Liquidity</td>
                    <td class="pool-item-value">$${parseFloat(this.currentPool.liquidity).toFixed(2).toLocaleString()}</td>
                </tr>
                <tr>
                    <td class="pool-item-label">24 Hour Fee</td>
                    <td class="pool-item-value">$${parseFloat(this.currentPool.fees_24h).toFixed(2).toLocaleString()}</td>
                </tr>
                <tr>
                    <td class="pool-item-label">Cumulative Trade Volume</td>
                    <td class="pool-item-value">$${parseFloat(this.currentPool.cumulative_trade_volume).toFixed(2).toLocaleString()}</td>
                </tr>
                <tr>
                    <td class="pool-item-label">Cumulative Fee Volume</td>
                    <td class="pool-item-value">$${parseFloat(this.currentPool.cumulative_fee_volume).toFixed(2).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        </div>
    `;

        // this.additionalInfoContainer.innerHTML = `
        // <div class="pool-data-wrapper">
        // <table>
        //     <tbody>
        //         ${Object.entries(this.currentPool).map(([key, value]) => `
        //             <tr>
        //                 <td class="pool-item-label">${key.replace(/_/g, ' ')}</td>
        //                 <td class="pool-item-value">${value}</td>
        //             </tr>
        //         `).join('')}
        //     </tbody>
        // </table>
        // </div>
    // `;
        this.estimate();
    }

    async analyzePoolHealth() {
        const userTVL = parseFloat(this.userTVLInput.value);
        const minLiquidity = this.config.minLiquidity;
        const minVolume = this.config.minVolume;

        // Calculate metrics
        const liquidityHealth = this.currentPool.liquidity >= minLiquidity ? 1 : 0;
        const volumeHealth = this.currentPool.trade_volume_24h >= minVolume ? 1 : 0;
        const significantPools = this.allPoolData.filter(p => (p.liquidity >= this.config.significantLiquidityThreshold && p.address === this.currentPool.address)).length;
        const diversityHealth = significantPools >= this.config.diversityThreshold ? 1 : 0;

        // User Liquidity Contribution
        const effectiveLiquidity = userTVL + this.currentPool.liquidity;
        const userContribution = (userTVL / effectiveLiquidity) * 100;

        // Projected Return Rate
        const projectedReturn = (userTVL / effectiveLiquidity) * this.currentPool.fees_24h;

        // Comparison with Other Pools
        const comparisonMetrics = this.compareWithOtherPools(this.currentPool);

        // Health Score Calculation
        const healthScore = this.calculateHealthScore({
            liquidityHealth,
            volumeHealth,
            diversityHealth,
            ...comparisonMetrics
        });

        return {
            liquidityHealth,
            volumeHealth,
            diversityHealth,
            userContribution: userContribution.toFixed(2),
            projectedReturn: projectedReturn.toFixed(2),
            healthScore
        };
    }

    async compareWithOtherPools() {
        // Compare with other pools with higher TVL and volume
        const higherTVLPools = this.allPoolData.filter(p => p.liquidity > this.currentPool.liquidity);
        const higherVolumePools = this.allPoolData.filter(p => p.trade_volume_24h > this.currentPool.trade_volume_24h);

        const higherTVLReturn = higherTVLPools.reduce((acc, p) => acc + p.fees_24h / p.liquidity, 0) / higherTVLPools.length;
        const higherVolumeReturn = higherVolumePools.reduce((acc, p) => acc + p.fees_24h / p.trade_volume_24h, 0) / higherVolumePools.length;

        return {
            higherTVLReturn: higherTVLReturn || 0, // Avoid NaN if there are no higher TVL pools
            higherVolumeReturn: higherVolumeReturn || 0 // Avoid NaN if there are no higher volume pools
        };
    }

    async calculateHealthScore(metrics) {
        const weights = {
            liquidityHealth: 0.2,
            volumeHealth: 0.2,
            diversityHealth: 0.2,
            higherTVLReturn: 0.2,
            higherVolumeReturn: 0.2
        };

        const weightedScore = (metrics.liquidityHealth * weights.liquidityHealth) +
            (metrics.volumeHealth * weights.volumeHealth) +
            (metrics.diversityHealth * weights.diversityHealth) +
            (metrics.higherTVLReturn * weights.higherTVLReturn) +
            (metrics.higherVolumeReturn * weights.higherVolumeReturn);

        return weightedScore;
    }

    async displayPoolHealth(healthMetrics) {
        this.poolHealthContainer.innerHTML = `
        <h3>Pool Health Analysis for ${this.currentPool.name}</h3>
        <table>
            <tbody>
                <tr>
                    <td>Liquidity Health:</td>
                    <td>${healthMetrics.liquidityHealth ? 'Good' : 'Poor'}</td>
                </tr>
                <tr>
                    <td>Volume Health:</td>
                    <td>${healthMetrics.volumeHealth ? 'Good' : 'Poor'}</td>
                </tr>
                <tr>
                    <td>Diversity Health:</td>
                    <td>${healthMetrics.diversityHealth ? 'Good' : 'Poor'}</td>
                </tr>
                <tr>
                    <td>User Contribution to Pool:</td>
                    <td>${healthMetrics.userContribution}%</td>
                </tr>
                <tr>
                    <td>Projected Return:</td>
                    <td>$${healthMetrics.projectedReturn}</td>
                </tr>
                <tr>
                    <td>Higher TVL Return Comparison:</td>
                    <td>${(healthMetrics.higherTVLReturn * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Higher Volume Return Comparison:</td>
                    <td>${(healthMetrics.higherVolumeReturn * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                    <td>Overall Health Score:</td>
                    <td>${healthMetrics.healthScore}/5</td>
                </tr>
            </tbody>
        </table>
    `;
    }

    async updatePoolData(pool, poolAddress=null) {
        if (poolAddress && !pool) {
            pool = this.allPoolData.find(p => p.address === poolAddress);
            console.log("set pool from poolAddress", pool)
        }
        this.searchInput.value = pool.name;
        console.log("set search input", this.searchInput)
        this.currentPool = pool;
        // TODO - switch to databasemanager
        localStorage.setItem('poolData', JSON.stringify(pool));
        this.displayPoolData();
        // this.analyzePoolHealth(pool).then(healthMetrics => this.displayPoolHealth(pool, healthMetrics));
    }

    copyTextToClipboard(text) {
        navigator.clipboard.writeText(text).then(function() {
            console.log("Copied text: ", text);
            // this.notificationManager.showNotification('Text copied to clipboard');
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
    }
}



const app = new App();
app.init();