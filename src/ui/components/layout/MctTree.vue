<template>
<div class="l-pane" :class="cssClass" :style="cssStyle">
    <div class="l-pane__elem c-search">
        <input placeholder="Search"/>
    </div>
    <ul class="l-pane__elem l-tree">
        <li class="l-tree__item-h">
            <div class="l-tree__item" onclick="alert('tree item click');">
                <span class="c-view-control"></span><span class="c-object-name icon-folder">
          Tree item x with a long name that forces ellipsis to occur
          </span>
            </div>
            <ul class="l-tree">
                <li class="l-tree__item-h">
                    <div class="l-tree__item" onclick="alert('tree item click');">
                        <span class="c-view-control"></span><span class="c-object-name icon-folder">Tree item y</span>
                    </div>
                </li>
            </ul>
        </li>
    </ul>
</div>
</template>

<style lang="scss">
  .l-tree {
    .l-tree {
      margin-left: 20px;
    }

    &__item {
      border-radius: 5px;
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
      cursor: pointer;
      padding: 5px;

      &:hover {
        background: rgba(white, 0.2);
      }

      .c-view-control {
        $d: 11px;
        background: rgba(red, 0.4);
        display: inline-block;
        flex: 0 0 auto;
        height: $d; width: $d;
        margin-right: 5px;
      }
    }
  }
</style>

<script>
  export default {
      props: {
          cssClass: String,
          cssStyle: String
      }
  }
</script>
