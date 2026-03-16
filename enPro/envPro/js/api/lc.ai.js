// 使用严格模式，避免隐式错误
"use strict";

$(document).ready(function() {
    // ===================== 常量配置区 =====================
    // 碳排放系数常量（抽离硬编码，便于维护）
    const CARBON_COEFFICIENTS = {
        walk: 0,
        bike: 0,
        bus: 28,
        subway: 14,
        car: 220,
        ev: 100,
        carpool: 50
    };

    /**
     * 页面初始化入口函数
     */
    function initPage() {
        initCarousel();          // 初始化轮播（保留原有UI组件）
        initCalcPanelToggle();   // 初始化计算器面板切换
        initTransportCount();    // 初始化出行方式数量选择
        initCarbonCalculation(); // 初始化碳排放计算事件
        initCarbonFootprintForm(); // 初始化碳足迹表单提交
    }

    /**
     * 初始化轮播组件
     */
    function initCarousel() {
        const $slider = $("#featured-work-slider");
        if ($slider.length) {
            $slider.owlCarousel({
                items: 3,
                itemsDesktop: [1199, 3],
                itemsDesktopSmall: [979, 2],
                itemsTablet: [768, 1],
                autoPlay: 5000,
                stopOnHover: true,
                pagination: true
            });
        }
    }

    /**
     * 初始化计算器面板切换
     */
    function initCalcPanelToggle() {
        $(".calc-btn").on("click", function() {
            const $this = $(this);
            // 移除所有激活态，给当前按钮添加激活态
            $(".calc-btn").removeClass("active");
            $this.addClass("active");
            
            // 切换对应面板
            const targetPanel = $this.data("target");
            $(".calc-panel").removeClass("active");
            $(`#${targetPanel}-panel`).addClass("active");
        });
    }

    /**
     * 初始化出行方式数量选择
     */
    function initTransportCount() {
        $("#transportCount").on("change", function() {
            const count = parseInt($(this).val(), 10);
            const $container = $("#transportItemsContainer");
            $container.empty();

            // 边界值校验
            if (isNaN(count) || count < 1 || count > 10) {
                alert("请选择1-10之间的出行方式数量");
                return;
            }

            // 动态生成出行方式项
            for (let i = 1; i <= count; i++) {
                const transportItem = createTransportItem(i);
                $container.append(transportItem);
            }

            // 重新绑定计算事件
            bindCarbonCalculation();
        });
    }

    /**
     * 初始化碳足迹表单提交事件
     */
    function initCarbonFootprintForm() {
        $("#carbonFootprintForm").on("submit", function(e) {
            e.preventDefault();
            
            try {
                // 计算总碳排放量和明细
                const calculationResult = calculateTotalCarbon();
                
                // 渲染计算结果
                renderCarbonResult(calculationResult);
            } catch (error) {
                console.error("碳足迹计算失败：", error);
                // 计算出错时不中断，仅提示
                return false;
            }
        });
    }

    /**
     * 创建单个出行方式DOM项
     * @param {number} index - 出行方式序号
     * @returns {string} DOM字符串
     */
    function createTransportItem(index) {
        return `
            <div class="transport-item">
                <label>方式${index}：</label>
                <select class="transport-select" name="transportTypes" required>
                    <option value="">请选择出行方式</option>
                    <option value="walk" data-coeff="${CARBON_COEFFICIENTS.walk}">步行 (0 g/公里)</option>
                    <option value="bike" data-coeff="${CARBON_COEFFICIENTS.bike}">自行车/电动车 (0 g/公里)</option>
                    <option value="bus" data-coeff="${CARBON_COEFFICIENTS.bus}">公交 (28 g/公里)</option>
                    <option value="subway" data-coeff="${CARBON_COEFFICIENTS.subway}">地铁 (14 g/公里)</option>
                    <option value="car" data-coeff="${CARBON_COEFFICIENTS.car}">私家车（燃油） (220 g/公里)</option>
                    <option value="ev" data-coeff="${CARBON_COEFFICIENTS.ev}">私家车（电动） (100 g/公里)</option>
                    <option value="carpool" data-coeff="${CARBON_COEFFICIENTS.carpool}">拼车出行 (50 g/公里)</option>
                </select>
                <input type="number" class="distance-input" name="distance" min="0" step="0.1" 
                       placeholder="出行公里数" required>
                <span class="carbon-label">碳排放：0 g</span>
            </div>
        `;
    }

    /**
     * 绑定碳排放实时计算事件
     */
    function bindCarbonCalculation() {
        // 使用事件委托，提升性能（避免重复绑定）
        $("#transportItemsContainer").off("change input", ".transport-select, .distance-input")
                                     .on("change input", ".transport-select, .distance-input", function() {
            const $item = $(this).closest(".transport-item");
            calculateSingleItemCarbon($item);
        });
    }

    /**
     * 计算单个出行方式项的碳排放量
     * @param {jQuery} $item - 出行方式项DOM对象
     */
    function calculateSingleItemCarbon($item) {
        // 获取系数和距离（做好类型转换和默认值）
        const coeff = parseFloat($item.find(".transport-select option:selected").data("coeff")) || 0;
        const distance = parseFloat($item.find(".distance-input").val()) || 0;
        const carbonEmission = coeff * distance;

        // 更新显示
        $item.find(".carbon-label").text(`碳排放：${carbonEmission.toFixed(1)} g`);
        
        return carbonEmission;
    }

    /**
     * 计算所有出行方式的总碳排放量
     * @returns {object} 包含总排放量、明细、出行方式列表的对象
     */
    function calculateTotalCarbon() {
        let totalCarbon = 0;
        const details = [];
        const transportTypes = [];

        // 遍历所有出行项计算
        $(".transport-item").each(function(index) {
            const $this = $(this);
            const $select = $this.find(".transport-select");
            const $distanceInput = $this.find(".distance-input");

            // 校验必填项
            if (!$select.val() || !$distanceInput.val()) {
                alert(`请完善第${index + 1}个出行方式的信息`);
                throw new Error(`第${index + 1}个出行方式信息不完整`);
            }

            // 获取基础数据
            const transportName = $select.find("option:selected").text();
            const distance = parseFloat($distanceInput.val());
            const carbonEmission = calculateSingleItemCarbon($this);

            // 累加计算
            totalCarbon += carbonEmission;
            transportTypes.push(transportName);

            // 构建明细项
            details.push(`
                <div class="footprint-detail-item">
                    ${transportName} - ${distance}公里：${carbonEmission.toFixed(1)} 克 CO₂
                </div>
            `);
        });

        return {
            totalCarbon: totalCarbon,
            details: details,
            transportTypes: transportTypes
        };
    }

    /**
     * 渲染碳足迹计算结果
     * @param {object} result - 计算结果对象
     */
    function renderCarbonResult(result) {
        // 渲染明细和总计
        $("#footprintDetails").html(result.details.join(''));
        $("#totalCarbon").text(result.totalCarbon.toFixed(1));
        
        // 生成并渲染减碳建议
        const suggestion = generateCarbonSuggestion(result.totalCarbon, result.transportTypes);
        $("#footprintSuggestion").text(suggestion);
        
        // 显示结果卡片
        $("#footprintResultCard").fadeIn();
    }

    /**
     * 生成减碳建议
     * @param {number} totalCarbon - 总碳排放量
     * @param {array} transportTypes - 出行方式列表
     * @returns {string} 减碳建议文本
     */
    function generateCarbonSuggestion(totalCarbon, transportTypes) {
        if (totalCarbon < 100) {
            return "您的出行碳排放量很低，继续保持绿色出行习惯！建议优先选择步行、自行车等零碳出行方式。";
        } else if (totalCarbon < 500) {
            return "您的出行碳排放处于中等水平，建议减少私家车使用，优先选择公交、地铁等公共交通，短途可尝试共享单车。";
        } else {
            return "您的出行碳排放量较高，建议优化出行方式：长距离优先选地铁/公交，中短途选电动车/拼车，短途步行/骑行，减少单人驾车出行。";
        }
    }

    /**
     * 初始化碳排放计算事件（页面加载时绑定）
     */
    function initCarbonCalculation() {
        bindCarbonCalculation();
    }

    // 执行页面初始化
    initPage();
});